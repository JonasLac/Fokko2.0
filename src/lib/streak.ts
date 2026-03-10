import { getLocalDateString, loadCompletionHistory, type Task } from "./fokko-data";

const STREAK_KEY = "fokko-streak";

interface StreakData {
  current: number;
  best: number;
  lastActiveDate: string;
}

/**
 * A day counts as "active" (for streak) only if ALL tasks were completed that day.
 * Accepts live tasks array so the calculation is always in sync with React state.
 */
const getActiveDates = (): Set<string> => {
  const dates = new Set<string>();
  const history = loadCompletionHistory();
  Object.entries(history).forEach(([date, allDone]) => {
    if (allDone) dates.add(date);
  });
  return dates;
};

const getPreviousDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
};

export const calculateStreak = (liveTasks?: Task[]): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const saved: StreakData | null = raw ? JSON.parse(raw) : null;

    const activeDates = getActiveDates();
    const today = getLocalDateString();
    const yesterday = getPreviousDate(today);

    // Use live tasks when provided (avoids stale localStorage read during React renders)
    const allTodayDone = liveTasks
      ? liveTasks.length > 0 && liveTasks.every((t) => t.completed)
      : false;

    const todayActive = allTodayDone || activeDates.has(today);

    // If neither today nor yesterday is active, streak is 0
    if (!todayActive && !activeDates.has(yesterday)) {
      const data: StreakData = { current: 0, best: saved?.best || 0, lastActiveDate: saved?.lastActiveDate || "" };
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      return data;
    }

    // Count consecutive days backwards
    let streak = 0;
    let checkDate = todayActive ? today : yesterday;

    const checkDates = new Set([...activeDates]);
    if (todayActive) checkDates.add(today);

    while (checkDates.has(checkDate)) {
      streak++;
      checkDate = getPreviousDate(checkDate);
    }

    const best = Math.max(streak, saved?.best || 0);
    const data: StreakData = { current: streak, best, lastActiveDate: todayActive ? today : yesterday };
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    return data;
  } catch {
    return { current: 0, best: 0, lastActiveDate: "" };
  }
};
