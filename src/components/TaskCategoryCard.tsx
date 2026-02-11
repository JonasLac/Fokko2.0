import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import type { Task, CategoryId, Category } from "@/lib/fokko-data";

interface TaskCategoryCardProps {
  category: Category;
  tasks: Task[];
  onToggle: (id: string) => void;
  onAdd: (title: string, category: CategoryId) => void;
  onDelete: (id: string) => void;
  onDeleteCategory?: () => void;
}

const TaskCategoryCard = ({ category, tasks, onToggle, onAdd, onDelete, onDeleteCategory }: TaskCategoryCardProps) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const categoryTasks = tasks.filter((t) => t.category === category.id);
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
    <div className="fokko-card p-4 fade-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${isCustom ? "" : category.bgClass}`}
            style={isCustom ? { background: `hsl(${category.color} / 0.15)` } : undefined}
          >
            <category.icon
              size={18}
              className={isCustom ? "" : category.colorClass}
              style={isCustom ? { color: `hsl(${category.color})` } : undefined}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
            <p className="text-xs text-muted-foreground">{completed}/{total} concluídas</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onDeleteCategory && (
            <button
              onClick={onDeleteCategory}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => setAdding(!adding)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus size={16} />
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
      <div className="space-y-1">
        {categoryTasks.map((task, index) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 rounded-lg px-2 py-2 transition-all duration-300 ${
              task.completed ? "opacity-50" : "hover:bg-secondary/50"
            }`}
            style={{ animationDelay: `${index * 0.04}s` }}
          >
            <button
              onClick={() => onToggle(task.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${
                task.completed
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              {task.completed && <Check size={12} className="text-primary-foreground check-bounce" />}
            </button>
            <span className={`flex-1 text-sm transition-all duration-300 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 transition-all duration-200 group-hover:opacity-100 hover:scale-110"
            >
              <Trash2 size={14} className="text-muted-foreground hover:text-destructive transition-colors" />
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
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors duration-200"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCategoryCard;
