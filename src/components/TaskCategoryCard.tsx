import { useState, useRef } from "react";
import { Check, Plus, Trash2, X, Star, Pin, PinOff, ChevronDown, Bell, BellOff } from "lucide-react";
import type { Task, CategoryId, Category } from "@/lib/fokko-data";
import { playTaskComplete, playTaskUncomplete, playPop } from "@/lib/sounds";
import { canNotify } from "@/lib/notifications";

interface TaskCategoryCardProps {
  category: Category;
  tasks: Task[];
  onToggle: (id: string) => void;
  onAdd: (title: string, category: CategoryId) => void;
  onDelete: (id: string) => void;
  onImportant: (id: string) => void;
  onSetReminder: (id: string, time: string | undefined) => void;
  onDeleteCategory?: () => void;
  pinned?: boolean;
  onPinToggle?: () => void;
  anyPinned?: boolean;
}

const TaskCategoryCard = ({
  category, tasks, onToggle, onAdd, onDelete, onImportant, onSetReminder,
  onDeleteCategory, pinned, onPinToggle, anyPinned,
}: TaskCategoryCardProps) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [showPinFor, setShowPinFor] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // Task id for which the reminder time picker is open
  const [reminderPickerId, setReminderPickerId] = useState<string | null>(null);
  const collapseRef = useRef<HTMLDivElement>(null);

  const categoryTasks = tasks.filter((t) => t.category === category.id);
  const sorted = [...categoryTasks].sort((a, b) => {
    if (a.important === b.important) return 0;
    return a.important ? -1 : 1;
  });
  const completed = categoryTasks.filter((t) => t.completed).length;
  const total = categoryTasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const isCustom = !!category.color;

  // Show pin button if: this category is pinned OR no category is pinned OR user tapped to reveal
  const showPinButton = pinned || !anyPinned || showPinFor;

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim(), category.id);
      setNewTitle("");
      setAdding(false);
    }
  };

  const handleHeaderTap = () => {
    if (anyPinned && !pinned) {
      setShowPinFor((v) => !v);
    }
  };

  const handleToggleTask = (task: Task) => {
    task.completed ? playTaskUncomplete() : playTaskComplete();
    onToggle(task.id);
  };

  const handleDeleteTask = (id: string) => {
    // Animate then delete
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDelete(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 270);
  };

  const handleImportantToggle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.important) {
      // Unmark: also clear reminder
      onImportant(task.id);
      onSetReminder(task.id, undefined);
      setReminderPickerId(null);
    } else {
      onImportant(task.id);
      // Show reminder picker if notifications are available
      if (canNotify()) {
        setReminderPickerId(task.id);
      }
    }
  };

  const handleSetReminder = (taskId: string, time: string) => {
    onSetReminder(taskId, time || undefined);
    setReminderPickerId(null);
  };

  return (
    <div className={`fokko-card p-4 fade-up ${pinned ? "ring-1 ring-primary/40" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex flex-1 items-center gap-3 active:opacity-70"
          onClick={handleHeaderTap}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCustom ? "" : category.bgClass}`}
            style={isCustom ? { background: `hsl(${category.color} / 0.15)` } : undefined}
          >
            <category.icon
              size={20}
              className={isCustom ? "" : category.colorClass}
              style={isCustom ? { color: `hsl(${category.color})` } : undefined}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
              {pinned && <Pin size={11} className="text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{completed}/{total} concluídas</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showPinButton && onPinToggle && (
            <button
              onClick={() => { playPop(); onPinToggle(); setShowPinFor(false); }}
              className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                pinned ? "text-primary active:bg-primary/20" : "text-muted-foreground active:bg-secondary active:text-foreground"
              }`}
              title={pinned ? "Desafixar categoria" : "Fixar categoria no topo"}
            >
              {pinned ? <PinOff size={17} /> : <Pin size={17} />}
            </button>
          )}
          {onDeleteCategory && (
            <button
              onClick={onDeleteCategory}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-destructive/20 active:text-destructive"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setAdding(!adding)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary active:text-foreground"
          >
            <Plus size={20} />
          </button>
          {/* Hide collapse icon when no tasks */}
          {total > 0 && (
            <button
              onClick={() => { playPop(); setCollapsed((v) => !v); }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 active:bg-secondary active:text-foreground"
            >
              <span className={`transition-transform duration-300 ${collapsed ? "rotate-0" : "rotate-180"}`}>
                <ChevronDown size={18} />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="progress-bar-animate h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: isCustom
              ? `hsl(${category.color})`
              : "linear-gradient(135deg, hsl(210 80% 55%), hsl(210 90% 40%))",
          }}
        />
      </div>

      {/* Tasks — animated collapse */}
      <div
        ref={collapseRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: collapsed ? "0px" : "2000px",
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div className="space-y-0.5">
          {sorted.map((task, index) => (
            <div key={task.id}>
              <div
                className={`flex items-center gap-3 rounded-lg px-2 py-2.5 transition-all duration-300 cursor-pointer ${
                  deletingIds.has(task.id) ? "task-delete pointer-events-none" : ""
                } ${task.completed ? "opacity-50" : "active:bg-secondary/50"}`}
                style={{ animationDelay: `${index * 0.04}s` }}
                onClick={() => !deletingIds.has(task.id) && handleToggleTask(task)}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 ${
                    task.completed
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {task.completed && <Check size={14} className="text-primary-foreground check-bounce" />}
                </div>
                <span className={`flex-1 text-sm transition-all duration-300 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </span>
                {/* Reminder bell — shown when task is important and notifications available */}
                {task.important && canNotify() && !task.completed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReminderPickerId(reminderPickerId === task.id ? null : task.id);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                      task.reminderAt ? "text-primary" : "text-muted-foreground/40 active:text-primary"
                    }`}
                    title={task.reminderAt ? `Lembrete: ${task.reminderAt}` : "Definir lembrete"}
                  >
                    {task.reminderAt ? <Bell size={14} className="fill-primary/20" /> : <Bell size={14} />}
                  </button>
                )}
                {total > 1 && (
                  <button
                    onClick={(e) => handleImportantToggle(task, e)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                      task.important ? "text-warning" : "text-muted-foreground/40 active:text-warning"
                    }`}
                  >
                    <Star size={15} className={task.important ? "fill-warning" : ""} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-90"
                >
                  <Trash2 size={16} className="text-muted-foreground/50 active:text-destructive transition-colors" />
                </button>
              </div>

              {/* Reminder time picker — inline, animated */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: reminderPickerId === task.id ? "80px" : "0px",
                  opacity: reminderPickerId === task.id ? 1 : 0,
                }}
              >
                <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                  <Bell size={14} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">Lembrete às:</p>
                  <input
                    type="time"
                    defaultValue={task.reminderAt || ""}
                    className="rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-foreground outline-none focus:border-primary transition-colors"
                    onChange={(e) => {/* controlled on confirm */}}
                    onBlur={(e) => handleSetReminder(task.id, e.target.value)}
                  />
                  {task.reminderAt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetReminder(task.id, ""); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground active:text-destructive transition-colors"
                      title="Remover lembrete"
                    >
                      <BellOff size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add task */}
      {adding && (
        <div className="mt-2 flex gap-2 expand-in">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nova tarefa..."
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors duration-200"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-95"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCategoryCard;
