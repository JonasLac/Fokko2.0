import { useState, useEffect, useMemo } from "react";
import { Sparkles, Plus, X } from "lucide-react";

import TaskCategoryCard from "@/components/TaskCategoryCard";
import {
  getAllCategories,
  loadTasks,
  saveTasks,
  saveCompletionSnapshot,
  motivationalQuotes,
  saveCustomCategory,
  deleteCustomCategory,
  getCustomColorOptions,
  checkAndResetDaily,
  getTodayFocusMinutes,
  type Task,
  type CategoryId,
  type Category,
} from "@/lib/fokko-data";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    checkAndResetDaily();
    return loadTasks();
  });
  const [allCategories, setAllCategories] = useState<Category[]>(getAllCategories);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(getCustomColorOptions()[0].hsl);

  useEffect(() => {
    saveTasks(tasks);
    saveCompletionSnapshot(tasks);
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

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const cat = saveCustomCategory(newCatName.trim(), newCatColor);
      setAllCategories((prev) => [...prev, cat]);
      setNewCatName("");
      setShowAddCategory(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCustomCategory(categoryId);
    setAllCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setTasks((prev) => prev.filter((t) => t.category !== categoryId));
  };

  // Focus history
  const todayFocus = getTodayFocusMinutes();

  // Circular progress
  const circleRadius = 44;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - completionPercent / 100);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md px-5 pt-12">
        {/* Header */}
        <div className="mb-6 fade-up stagger-1">
          <h1 className="text-2xl font-bold text-foreground">{greeting}! 👋</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dateStr}</p>
        </div>

        {/* Progress Overview */}
        <div className="fokko-card mb-6 p-5 fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Circular progress */}
              <div className="relative h-24 w-24 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r={circleRadius}
                    fill="none"
                    stroke="hsl(220 18% 18%)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50" cy="50" r={circleRadius}
                    fill="none"
                    stroke={completionPercent === 100 ? "hsl(142 70% 45%)" : "hsl(210 80% 55%)"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gradient">{completionPercent}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{totalCount} tarefas concluídas
                </p>
                {completionPercent === 100 && totalCount > 0 && (
                  <p className="mt-1 text-xs text-success font-medium animate-pop">🎉 Tudo concluído!</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">{todayFocus}min</div>
              <p className="text-xs text-muted-foreground">tempo de foco</p>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3 fade-up stagger-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-foreground/80">{quote}</p>
        </div>

        {/* Task Categories */}
        <div className="space-y-4">
          {allCategories.map((cat, index) => (
            <div key={cat.id} className="slide-in-bottom" style={{ animationDelay: `${0.15 + index * 0.07}s` }}>
              <TaskCategoryCard
                category={cat}
                tasks={tasks}
                onToggle={toggleTask}
                onAdd={addTask}
                onDelete={deleteTask}
                onDeleteCategory={cat.color ? () => handleDeleteCategory(cat.id) : undefined}
              />
            </div>
          ))}
        </div>

        {/* Add Category Button */}
        <div className="mt-4 slide-in-bottom" style={{ animationDelay: '0.35s' }}>
          {!showAddCategory ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground transition-all duration-300 active:scale-[0.98] active:border-primary active:text-foreground"
            >
              <Plus size={18} />
              Nova categoria
            </button>
          ) : (
            <div className="fokko-card p-4 space-y-3 expand-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Nova Categoria</h3>
                <button onClick={() => setShowAddCategory(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground active:text-foreground transition-colors duration-200">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Nome da categoria..."
                className="w-full rounded-lg border border-border bg-secondary px-3 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors duration-200"
              />
              <div className="flex gap-2">
                {getCustomColorOptions().map((opt, i) => (
                  <button
                    key={opt.hsl}
                    onClick={() => setNewCatColor(opt.hsl)}
                    className={`h-9 w-9 rounded-full transition-all duration-300 ${newCatColor === opt.hsl ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""}`}
                    style={{ background: `hsl(${opt.hsl})` }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98]"
              >
                Criar categoria
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
