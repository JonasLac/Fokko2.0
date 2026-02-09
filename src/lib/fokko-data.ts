import { Home, Briefcase, BookOpen, Dumbbell, Heart } from "lucide-react";

export type CategoryId = "home" | "work" | "study" | "exercise" | "personal";

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
  icon: typeof Home;
  colorClass: string;
  bgClass: string;
}

export const categories: Category[] = [
  { id: "home", label: "Casa", icon: Home, colorClass: "text-category-home", bgClass: "bg-category-home/15" },
  { id: "work", label: "Trabalho", icon: Briefcase, colorClass: "text-category-work", bgClass: "bg-category-work/15" },
  { id: "study", label: "Estudos", icon: BookOpen, colorClass: "text-category-study", bgClass: "bg-category-study/15" },
  { id: "exercise", label: "Exercícios", icon: Dumbbell, colorClass: "text-category-exercise", bgClass: "bg-category-exercise/15" },
  { id: "personal", label: "Pessoal", icon: Heart, colorClass: "text-category-personal", bgClass: "bg-category-personal/15" },
];

const STORAGE_KEY = "fokko-tasks";

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
