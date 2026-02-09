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

const getDefaultTasks = (): Task[] => [
  { id: "1", title: "Arrumar a cama", category: "home", completed: false, createdAt: new Date().toISOString() },
  { id: "2", title: "Revisar relatório", category: "work", completed: false, createdAt: new Date().toISOString() },
  { id: "3", title: "Ler 30 páginas", category: "study", completed: true, createdAt: new Date().toISOString() },
  { id: "4", title: "Treino de 30min", category: "exercise", completed: false, createdAt: new Date().toISOString() },
  { id: "5", title: "Meditar 10min", category: "personal", completed: false, createdAt: new Date().toISOString() },
];

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
