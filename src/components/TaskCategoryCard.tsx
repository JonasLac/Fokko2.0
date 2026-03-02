import { useState } from "react";
import { Check, Plus, Trash2, X, Star, Pin, PinOff } from "lucide-react";
import type { Task, CategoryId, Category } from "@/lib/fokko-data";
import { playTaskComplete, playTaskUncomplete, playPop } from "@/lib/sounds";

interface TaskCategoryCardProps {
  category: Category;
  tasks: Task[];
  onToggle: (id: string) => void;
  onAdd: (title: string, category: CategoryId) => void;
  onDelete: (id: string) => void;
  onImportant: (id: string) => void;
  onDeleteCategory?: () => void;
  pinned?: boolean;
  onPinToggle?: () => void;
}

const TaskCategoryCard = ({ category, tasks, onToggle, onAdd, onDelete, onImportant, onDeleteCategory, pinned, onPinToggle }: TaskCategoryCardProps) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const categoryTasks = tasks.filter((t) => t.category === category.id);
  // Sort: important first, then by createdAt
  const sorted = [...categoryTasks].sort((a, b) => {
    if (a.important === b.important) return 0;
    return a.important ? -1 : 1;
  });
  const completed = categoryTasks.filter((t) => t.completed).length;
  const total = categoryTasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const isCustom = !!category.color;

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim(), category.id);
      setNewTitle("");
      setAdding(false);
    }
  };

  return (
    <div className={`fokko-card p-4 fade-up ${pinned ? "ring-1 ring-primary/40" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          {onPinToggle && (
            <button
              onClick={() => { playPop(); onPinToggle(); }}
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

      {/* Tasks */}
      <div className="space-y-0.5">
        {sorted.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 rounded-lg px-2 py-2.5 transition-all duration-300 ${
              task.completed ? "opacity-50" : "active:bg-secondary/50"
            }`}
            style={{ animationDelay: `${index * 0.04}s` }}
          >
            <button
              onClick={() => { task.completed ? playTaskUncomplete() : playTaskComplete(); onToggle(task.id); }}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 ${
                task.completed
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 active:border-primary"
              }`}
            >
              {task.completed && <Check size={14} className="text-primary-foreground check-bounce" />}
            </button>
            <span className={`flex-1 text-sm transition-all duration-300 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </span>
            <button
              onClick={() => onImportant(task.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                task.important ? "text-warning" : "text-muted-foreground/40 active:text-warning"
              }`}
            >
              <Star size={15} className={task.important ? "fill-warning" : ""} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-90"
            >
              <Trash2 size={16} className="text-muted-foreground/50 active:text-destructive transition-colors" />
            </button>
          </div>
        ))}
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
