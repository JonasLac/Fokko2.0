import { useState, useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TaskCategoryCard from "@/components/TaskCategoryCard";
import { categories, loadTasks, saveTasks, motivationalQuotes, type Task, type CategoryId } from "@/lib/fokko-data";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const quote = useMemo(
    () => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],
    []
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = (title: string, category: CategoryId) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Focus history
  const todayFocus = (() => {
    try {
      const raw = localStorage.getItem("fokko-focus-history");
      const history = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().split("T")[0];
      return history.find((s: any) => s.date === today)?.minutes || 0;
    } catch { return 0; }
  })();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        {/* Header */}
        <div className="mb-6 fade-up">
          <h1 className="text-2xl font-bold text-foreground">{greeting}! 👋</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dateStr}</p>
        </div>

        {/* Progress Overview */}
        <div className="fokko-card mb-6 p-5 fade-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gradient">{completionPercent}%</div>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{totalCount} tarefas concluídas
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">{todayFocus}min</div>
              <p className="text-xs text-muted-foreground">tempo de foco</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="progress-bar-animate h-full rounded-full fokko-gradient"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3 fade-up">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-foreground/80">{quote}</p>
        </div>

        {/* Task Categories */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <TaskCategoryCard
              key={cat.id}
              categoryId={cat.id}
              tasks={tasks}
              onToggle={toggleTask}
              onAdd={addTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
