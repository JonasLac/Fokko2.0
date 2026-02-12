import { Home, Briefcase, BookOpen, Dumbbell, Heart, type LucideIcon } from "lucide-react";

export type CategoryId = string;

export interface Task {
  id: string;
  title: string;
  category: CategoryId;
  completed: boolean;
  createdAt: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  color?: string; // HSL string for custom categories
}

export const defaultCategories: Category[] = [
  { id: "home", label: "Casa", icon: Home, colorClass: "text-category-home", bgClass: "bg-category-home/15" },
  { id: "work", label: "Trabalho", icon: Briefcase, colorClass: "text-category-work", bgClass: "bg-category-work/15" },
  { id: "study", label: "Estudos", icon: BookOpen, colorClass: "text-category-study", bgClass: "bg-category-study/15" },
  { id: "exercise", label: "Exercícios", icon: Dumbbell, colorClass: "text-category-exercise", bgClass: "bg-category-exercise/15" },
  { id: "personal", label: "Pessoal", icon: Heart, colorClass: "text-category-personal", bgClass: "bg-category-personal/15" },
];

const STORAGE_KEY = "fokko-tasks";
const CUSTOM_CATEGORIES_KEY = "fokko-custom-categories";
const COMPLETION_HISTORY_KEY = "fokko-completion-history";
const LAST_RESET_KEY = "fokko-last-reset";
const FOCUS_CYCLES_KEY = "fokko-focus-cycles";

// Check if tasks should be reset (new day)
export const checkAndResetDaily = (): boolean => {
  const today = new Date().toISOString().split("T")[0];
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  if (lastReset === today) return false;

  // Save yesterday's snapshot before resetting
  const tasks = loadTasks();
  if (tasks.length > 0) {
    saveCompletionSnapshot(tasks);
  }

  // Reset all tasks to uncompleted
  const resetTasks = tasks.map((t) => ({ ...t, completed: false }));
  saveTasks(resetTasks);

  // Reset focus history for today
  try {
    const raw = localStorage.getItem("fokko-focus-history");
    const history: { date: string; minutes: number }[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter((s) => s.date !== today);
    localStorage.setItem("fokko-focus-history", JSON.stringify(filtered));
  } catch {}

  // Reset focus cycles
  localStorage.setItem(FOCUS_CYCLES_KEY, JSON.stringify({ date: today, count: 0 }));

  localStorage.setItem(LAST_RESET_KEY, today);
  return true;
};

export const getFocusCycles = (): { date: string; count: number } => {
  try {
    const raw = localStorage.getItem(FOCUS_CYCLES_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toISOString().split("T")[0];
      if (data.date === today) return data;
    }
  } catch {}
  return { date: new Date().toISOString().split("T")[0], count: 0 };
};

export const incrementFocusCycle = (): number => {
  const today = new Date().toISOString().split("T")[0];
  const current = getFocusCycles();
  const newCount = current.date === today ? current.count + 1 : 1;
  localStorage.setItem(FOCUS_CYCLES_KEY, JSON.stringify({ date: today, count: newCount }));
  return newCount;
};

// Icon map for custom categories (cycle through these)
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
  color: string; // HSL values like "190 80% 50%"
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

export const getAllCategories = (): Category[] => {
  return [...defaultCategories, ...loadCustomCategories()];
};

// Keep backward compat
export const categories = defaultCategories;

export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultTasks();
  } catch {
    return getDefaultTasks();
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const getDefaultTasks = (): Task[] => [];

export const motivationalQuotes = [
  "Cada tarefa concluída é um passo rumo à sua melhor versão. 🚀",
  "Disciplina é escolher entre o que você quer agora e o que você mais quer. 💪",
  "Pequenos progressos diários levam a resultados extraordinários. ⭐",
  "O foco é a ponte entre onde você está e onde quer chegar. 🌉",
  "Não espere por motivação. Crie disciplina. 🔥",
];

// Completion history: track days where all tasks were completed
export const saveCompletionSnapshot = (tasks: Task[]) => {
  if (tasks.length === 0) return;
  const today = new Date().toISOString().split("T")[0];
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
