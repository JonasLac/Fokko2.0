import { Home, Briefcase, BookOpen, Dumbbell, Heart, type LucideIcon } from "lucide-react";

export type CategoryId = string;

export interface Task {
  id: string;
  title: string;
  category: CategoryId;
  completed: boolean;
  important: boolean;
  createdAt: string;
  reminderAt?: string; // "HH:MM" local time for important task notification
}

export interface FocusSessionRecord {
  id: string;
  date: string; // YYYY-MM-DD local
  taskId?: string;
  taskTitle?: string;
  category?: CategoryId;
  goalMinutes: number;
  actualMinutes: number;
  startedAt: string; // ISO
  finishedAt: string; // ISO
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  color?: string;
}

// ── Helper: local date string ──
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// ── Categories ──
export const defaultCategories: Category[] = [
  { id: "home", label: "Casa", icon: Home, colorClass: "text-category-home", bgClass: "bg-category-home/15" },
  { id: "work", label: "Trabalho", icon: Briefcase, colorClass: "text-category-work", bgClass: "bg-category-work/15" },
  { id: "study", label: "Estudos", icon: BookOpen, colorClass: "text-category-study", bgClass: "bg-category-study/15" },
  { id: "exercise", label: "Exercícios", icon: Dumbbell, colorClass: "text-category-exercise", bgClass: "bg-category-exercise/15" },
  { id: "personal", label: "Pessoal", icon: Heart, colorClass: "text-category-personal", bgClass: "bg-category-personal/15" },
];

const STORAGE_KEY = "fokko-tasks";
const PINNED_CATEGORY_KEY = "fokko-pinned-category";
const CUSTOM_CATEGORIES_KEY = "fokko-custom-categories";
const COMPLETION_HISTORY_KEY = "fokko-completion-history";
const LAST_RESET_KEY = "fokko-last-reset";
const FOCUS_CYCLES_KEY = "fokko-focus-cycles";
const FOCUS_SESSIONS_KEY = "fokko-focus-sessions";
const FOCUS_DAILY_KEY = "fokko-focus-history";
const FOCUS_ENABLED_KEY = "fokko-focus-enabled";

// ── Focus enabled setting ──
export const isFocusEnabled = (): boolean => {
  try {
    const raw = localStorage.getItem(FOCUS_ENABLED_KEY);
    return raw === null ? true : JSON.parse(raw);
  } catch {
    return true;
  }
};

export const setFocusEnabled = (enabled: boolean) => {
  localStorage.setItem(FOCUS_ENABLED_KEY, JSON.stringify(enabled));
};

// ── Daily reset ──
export const checkAndResetDaily = (): boolean => {
  const today = getLocalDateString();
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  if (lastReset === today) return false;

  const tasks = loadTasks();
  if (tasks.length > 0) {
    saveCompletionSnapshot(tasks);
  }

  const resetTasks = tasks.map((t) => ({ ...t, completed: false }));
  saveTasks(resetTasks);

  // Reset focus daily minutes for today
  try {
    const raw = localStorage.getItem(FOCUS_DAILY_KEY);
    const history: { date: string; minutes: number }[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter((s) => s.date !== today);
    localStorage.setItem(FOCUS_DAILY_KEY, JSON.stringify(filtered));
  } catch {}

  localStorage.setItem(FOCUS_CYCLES_KEY, JSON.stringify({ date: today, count: 0 }));
  localStorage.setItem(LAST_RESET_KEY, today);
  return true;
};

// ── Focus cycles ──
export const getFocusCycles = (): { date: string; count: number } => {
  try {
    const raw = localStorage.getItem(FOCUS_CYCLES_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = getLocalDateString();
      if (data.date === today) return data;
    }
  } catch {}
  return { date: getLocalDateString(), count: 0 };
};

export const incrementFocusCycle = (): number => {
  const today = getLocalDateString();
  const current = getFocusCycles();
  const newCount = current.date === today ? current.count + 1 : 1;
  localStorage.setItem(FOCUS_CYCLES_KEY, JSON.stringify({ date: today, count: newCount }));
  return newCount;
};

// ── Focus sessions (detailed) ──
export const loadFocusSessions = (): FocusSessionRecord[] => {
  try {
    const raw = localStorage.getItem(FOCUS_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveFocusSession = (session: FocusSessionRecord) => {
  const sessions = loadFocusSessions();
  sessions.push(session);
  localStorage.setItem(FOCUS_SESSIONS_KEY, JSON.stringify(sessions));

  // Also update daily minutes aggregate
  try {
    const raw = localStorage.getItem(FOCUS_DAILY_KEY);
    const history: { date: string; minutes: number }[] = raw ? JSON.parse(raw) : [];
    const existing = history.find((s) => s.date === session.date);
    if (existing) {
      existing.minutes += session.actualMinutes;
    } else {
      history.push({ date: session.date, minutes: session.actualMinutes });
    }
    localStorage.setItem(FOCUS_DAILY_KEY, JSON.stringify(history));
  } catch {}
};

export const getTodayFocusMinutes = (): number => {
  try {
    const raw = localStorage.getItem(FOCUS_DAILY_KEY);
    const history: { date: string; minutes: number }[] = raw ? JSON.parse(raw) : [];
    const today = getLocalDateString();
    return history.find((s) => s.date === today)?.minutes || 0;
  } catch {
    return 0;
  }
};

export const getWeekFocusMinutes = (): number => {
  const sessions = loadFocusSessions();
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dow);
  const weekStartStr = getLocalDateString(weekStart);

  return sessions
    .filter((s) => s.date >= weekStartStr)
    .reduce((sum, s) => sum + s.actualMinutes, 0);
};

export const getDailyAverageFocus = (): number => {
  const sessions = loadFocusSessions();
  if (sessions.length === 0) return 0;
  const byDate = new Map<string, number>();
  sessions.forEach((s) => {
    byDate.set(s.date, (byDate.get(s.date) || 0) + s.actualMinutes);
  });
  const total = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
  return Math.round(total / byDate.size);
};

// ── Custom categories ──
const customIcons: LucideIcon[] = [Heart, Briefcase, BookOpen, Dumbbell, Home];

const customColorOptions = [
  { hsl: "190 80% 50%", label: "Ciano" },
  { hsl: "45 90% 55%", label: "Amarelo" },
  { hsl: "160 60% 45%", label: "Verde-água" },
  { hsl: "300 65% 55%", label: "Roxo" },
  { hsl: "15 85% 55%", label: "Vermelho" },
  { hsl: "200 70% 60%", label: "Azul claro" },
];

export const getCustomColorOptions = () => customColorOptions;

interface StoredCustomCategory {
  id: string;
  label: string;
  color: string;
  iconIndex: number;
}

export const loadCustomCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const stored: StoredCustomCategory[] = JSON.parse(raw);
    return stored.map((s) => ({
      id: s.id,
      label: s.label,
      icon: customIcons[s.iconIndex % customIcons.length],
      colorClass: "",
      bgClass: "",
      color: s.color,
    }));
  } catch {
    return [];
  }
};

export const saveCustomCategory = (label: string, colorHsl: string): Category => {
  const stored = (() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })() as StoredCustomCategory[];

  const id = `custom-${Date.now()}`;
  const iconIndex = stored.length % customIcons.length;
  stored.push({ id, label, color: colorHsl, iconIndex });
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(stored));

  return {
    id,
    label,
    icon: customIcons[iconIndex],
    colorClass: "",
    bgClass: "",
    color: colorHsl,
  };
};

export const deleteCustomCategory = (id: string) => {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return;
    const stored: StoredCustomCategory[] = JSON.parse(raw);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(stored.filter((s) => s.id !== id)));
  } catch {}
};

// ── Pinned category ──
export const getPinnedCategory = (): string | null => {
  return localStorage.getItem(PINNED_CATEGORY_KEY);
};

export const setPinnedCategory = (id: string | null) => {
  if (id === null) localStorage.removeItem(PINNED_CATEGORY_KEY);
  else localStorage.setItem(PINNED_CATEGORY_KEY, id);
};

export const getAllCategories = (): Category[] => {
  return [...defaultCategories, ...loadCustomCategories()];
};

export const categories = defaultCategories;

// ── Tasks ──
export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// ── Quotes ──
export const motivationalQuotes = [
  "Cada tarefa concluída é um passo rumo à sua melhor versão. 🚀",
  "Disciplina é escolher entre o que você quer agora e o que você mais quer. 💪",
  "Pequenos progressos diários levam a resultados extraordinários. ⭐",
  "O foco é a ponte entre onde você está e onde quer chegar. 🌉",
  "Não espere por motivação. Crie disciplina. 🔥",
];

// ── Completion history ──
export const saveCompletionSnapshot = (tasks: Task[]) => {
  if (tasks.length === 0) return;
  const today = getLocalDateString();
  const allCompleted = tasks.every((t) => t.completed);
  try {
    const raw = localStorage.getItem(COMPLETION_HISTORY_KEY);
    const history: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    history[today] = allCompleted;
    localStorage.setItem(COMPLETION_HISTORY_KEY, JSON.stringify(history));
  } catch {}
};

export const loadCompletionHistory = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(COMPLETION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
