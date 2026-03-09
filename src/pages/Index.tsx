import { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Plus, X, Flame, PartyPopper } from "lucide-react";

import TaskCategoryCard from "@/components/TaskCategoryCard";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  isFocusEnabled,
  getPinnedCategory,
  setPinnedCategory,
  getLocalDateString,
  type Task,
  type CategoryId,
  type Category,
} from "@/lib/fokko-data";
import { calculateStreak } from "@/lib/streak";
import {
  requestNotificationPermission,
  hasAskedPermission,
  scheduleDailyReminder,
} from "@/lib/notifications";

// Key to track which date the celebration was already shown
const CELEBRATION_SHOWN_KEY = "fokko-celebration-shown-date";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    checkAndResetDaily();
    return loadTasks();
  });
  const [allCategories, setAllCategories] = useState<Category[]>(getAllCategories);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(getCustomColorOptions()[0].hsl);
  const [pinnedCategoryId, setPinnedCategoryId] = useState<string | null>(getPinnedCategory);

  // Rotating quote
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * motivationalQuotes.length));
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % motivationalQuotes.length);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);
  const quote = motivationalQuotes[quoteIdx];

  // Celebration overlay — persisted per-day so it won't replay on tab switch
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationFiredRef = useRef(false);

  // Delete confirmation
  const [deleteTaskPending, setDeleteTaskPending] = useState<string | null>(null);
  const [deleteCatPending, setDeleteCatPending] = useState<string | null>(null);

  useEffect(() => {
    saveTasks(tasks);
    saveCompletionSnapshot(tasks);
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Show celebration when all tasks just became done
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 3500);
      prevAllDoneRef.current = true;
      return () => clearTimeout(t);
    }
    if (!allDone) prevAllDoneRef.current = false;
  }, [allDone]);

  const streak = useMemo(() => calculateStreak(), [tasks]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const toggleImportant = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, important: !t.important } : t)));
  };

  const addTask = (title: string, category: CategoryId) => {
    const newTask: Task = { id: Date.now().toString(), title, category, completed: false, important: false, createdAt: new Date().toISOString() };
    setTasks((prev) => [...prev, newTask]);
  };

  // Delete task — ask confirmation
  const requestDeleteTask = (id: string) => setDeleteTaskPending(id);
  const confirmDeleteTask = () => {
    if (deleteTaskPending) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskPending));
      setDeleteTaskPending(null);
    }
  };

  // Delete category — ask confirmation
  const requestDeleteCategory = (categoryId: string) => setDeleteCatPending(categoryId);
  const confirmDeleteCategory = () => {
    if (!deleteCatPending) return;
    deleteCustomCategory(deleteCatPending);
    setAllCategories((prev) => prev.filter((c) => c.id !== deleteCatPending));
    setTasks((prev) => prev.filter((t) => t.category !== deleteCatPending));
    if (pinnedCategoryId === deleteCatPending) {
      setPinnedCategoryId(null);
      setPinnedCategory(null);
    }
    setDeleteCatPending(null);
  };

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const cat = saveCustomCategory(newCatName.trim(), newCatColor);
      setAllCategories((prev) => [...prev, cat]);
      setNewCatName("");
      setShowAddCategory(false);
    }
  };

  const handlePinToggle = (categoryId: string) => {
    const newPinned = pinnedCategoryId === categoryId ? null : categoryId;
    setPinnedCategoryId(newPinned);
    setPinnedCategory(newPinned);
  };

  const orderedCategories = useMemo(() => {
    if (!pinnedCategoryId) return allCategories;
    const idx = allCategories.findIndex((c) => c.id === pinnedCategoryId);
    if (idx <= 0) return allCategories;
    const arr = [...allCategories];
    const [pinned] = arr.splice(idx, 1);
    return [pinned, ...arr];
  }, [allCategories, pinnedCategoryId]);

  const focusOn = isFocusEnabled();
  const todayFocus = focusOn ? getTodayFocusMinutes() : 0;

  const circleRadius = 44;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - completionPercent / 100);

  // Determine circle track color based on color scheme
  const isDark = !window.matchMedia("(prefers-color-scheme: light)").matches;
  const circleTrackColor = isDark ? "hsl(220 18% 15%)" : "hsl(210 20% 88%)";

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="celebration-overlay flex flex-col items-center gap-4 rounded-3xl bg-card/95 border border-border/50 px-10 py-8 shadow-2xl mx-6 text-center">
            <PartyPopper size={52} className="text-warning" />
            <div>
              <p className="text-xl font-bold text-foreground">Incrível! 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">Todas as tarefas concluídas!</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-5 pt-12">
        {/* Header */}
        <div className="mb-6 fade-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{greeting}! 👋</h1>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{dateStr}</p>
            </div>
            {streak.current > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 animate-scale-in">
                <Flame size={16} className="text-warning" />
                <span className="text-sm font-bold text-warning">{streak.current}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress + Focus */}
        <div className="fokko-card mb-5 p-5 fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={circleRadius} fill="none" stroke={circleTrackColor} strokeWidth="7" />
                  <circle
                    cx="50" cy="50" r={circleRadius} fill="none"
                    stroke={completionPercent === 100 ? "hsl(142 70% 45%)" : "hsl(210 80% 55%)"}
                    strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gradient">{completionPercent}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{completedCount}/{totalCount} concluídas</p>
              </div>
            </div>
            {focusOn && (
              <div className="text-right">
                <div className="text-lg font-semibold text-foreground">{todayFocus}min</div>
                <p className="text-xs text-muted-foreground">tempo de foco</p>
              </div>
            )}
          </div>
        </div>

        {/* Quote */}
        <div key={quoteIdx} className="mb-5 flex items-start gap-3 rounded-xl bg-primary/8 px-4 py-3 fade-up stagger-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-foreground/80">{quote}</p>
        </div>

        {/* Task Categories */}
        <div className="space-y-3">
          {orderedCategories.map((cat, index) => (
            <div key={cat.id} className="slide-in-bottom" style={{ animationDelay: `${0.15 + index * 0.07}s` }}>
              <TaskCategoryCard
                category={cat} tasks={tasks}
                onToggle={toggleTask} onAdd={addTask} onDelete={requestDeleteTask}
                onImportant={toggleImportant}
                onDeleteCategory={cat.color ? () => requestDeleteCategory(cat.id) : undefined}
                pinned={pinnedCategoryId === cat.id}
                onPinToggle={() => handlePinToggle(cat.id)}
                anyPinned={!!pinnedCategoryId}
              />
            </div>
          ))}
        </div>

        {/* Add Category */}
        <div className="mt-3 slide-in-bottom" style={{ animationDelay: "0.35s" }}>
          {!showAddCategory ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground active:scale-[0.98] active:border-primary active:text-foreground"
            >
              <Plus size={18} />
              Nova categoria
            </button>
          ) : (
            <div className="fokko-card p-4 space-y-3 expand-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Nova Categoria</h3>
                <button onClick={() => setShowAddCategory(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground active:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Nome da categoria..."
                className="w-full rounded-lg border border-border bg-secondary px-3 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                {getCustomColorOptions().map((opt) => (
                  <button
                    key={opt.hsl} onClick={() => setNewCatColor(opt.hsl)}
                    className={`h-9 w-9 rounded-full transition-all ${newCatColor === opt.hsl ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""}`}
                    style={{ background: `hsl(${opt.hsl})` }}
                  />
                ))}
              </div>
              <button onClick={handleAddCategory} className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground active:scale-[0.98]">
                Criar categoria
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete task confirmation */}
      <ConfirmDialog
        open={!!deleteTaskPending}
        title="Excluir tarefa?"
        description="Esta tarefa será removida permanentemente."
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTaskPending(null)}
      />

      {/* Delete category confirmation */}
      <ConfirmDialog
        open={!!deleteCatPending}
        title="Excluir categoria?"
        description="A categoria e todas as suas tarefas serão removidas permanentemente."
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteCatPending(null)}
      />
    </div>
  );
};

export default Index;
