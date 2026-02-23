import { getLocalDateString, loadCompletionHistory, loadFocusSessions } from "./fokko-data";

const STREAK_KEY = "fokko-streak";

interface StreakData {
  current: number;
  best: number;
  lastActiveDate: string;
}

/**
 * A day counts as "active" if the user completed at least 1 task
 * OR had at least 1 focus session on that date.
 */
const getActiveDates = (): Set<string> => {
  const dates = new Set<string>();

  // From completion history (any entry means tasks existed that day)
  const history = loadCompletionHistory();
  Object.keys(history).forEach((d) => dates.add(d));

  // From focus sessions
  const sessions = loadFocusSessions();
  sessions.forEach((s) => dates.add(s.date));

  return dates;
};

const getPreviousDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
};

export const calculateStreak = (): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const saved: StreakData | null = raw ? JSON.parse(raw) : null;

    const activeDates = getActiveDates();
    const today = getLocalDateString();
    const yesterday = getPreviousDate(today);

    // Check if today is active
    const todayActive = activeDates.has(today);

    // Start counting from today or yesterday
    let streak = 0;
    let checkDate = todayActive ? today : yesterday;

    // If neither today nor yesterday is active, streak is 0
    if (!todayActive && !activeDates.has(yesterday)) {
      const data: StreakData = { current: 0, best: saved?.best || 0, lastActiveDate: saved?.lastActiveDate || "" };
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      return data;
    }

    // Count consecutive days backwards
    while (activeDates.has(checkDate)) {
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
