import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { categories, type Task, type CategoryId } from "@/lib/fokko-data";

interface TaskCategoryCardProps {
  categoryId: CategoryId;
  tasks: Task[];
  onToggle: (id: string) => void;
  onAdd: (title: string, category: CategoryId) => void;
  onDelete: (id: string) => void;
}

const TaskCategoryCard = ({ categoryId, tasks, onToggle, onAdd, onDelete }: TaskCategoryCardProps) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const category = categories.find((c) => c.id === categoryId)!;
  const categoryTasks = tasks.filter((t) => t.category === categoryId);
  const completed = categoryTasks.filter((t) => t.completed).length;
  const total = categoryTasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim(), categoryId);
      setNewTitle("");
      setAdding(false);
    }
  };

  return (
    <div className="fokko-card p-4 fade-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${category.bgClass}`}>
            <category.icon size={18} className={category.colorClass} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
            <p className="text-xs text-muted-foreground">{completed}/{total} concluídas</p>
          </div>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="progress-bar-animate h-full rounded-full fokko-gradient"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {categoryTasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 rounded-lg px-2 py-2 transition-all ${
              task.completed ? "opacity-50" : "hover:bg-secondary/50"
            }`}
          >
            <button
              onClick={() => onToggle(task.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                task.completed
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              {task.completed && <Check size={12} className="text-primary-foreground" />}
            </button>
            <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {/* Add task */}
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nova tarefa..."
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCategoryCard;
