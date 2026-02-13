import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Info, Trophy, Plus, ChevronDown } from "lucide-react";

import {
  getFocusCycles,
  incrementFocusCycle,
  saveFocusSession,
  getTodayFocusMinutes,
  loadTasks,
  getAllCategories,
  getLocalDateString,
  type Task,
  type FocusSessionRecord,
} from "@/lib/fokko-data";

const presets = [15, 25, 45, 60];

const FocusPage = () => {
  const [goalMinutes, setGoalMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(getFocusCycles().count);
  const [showCycleComplete, setShowCycleComplete] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Task linking
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const tasks = loadTasks().filter((t) => !t.completed);
  const allCategories = getAllCategories();

  // Session tracking
  const startTimeRef = useRef<Date | null>(null);

  const totalSeconds = goalMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const todayFocus = getTodayFocusMinutes();

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(goalMinutes * 60);
    setCompleted(false);
    startTimeRef.current = null;
  }, [goalMinutes]);

  useEffect(() => {
    setSecondsLeft(goalMinutes * 60);
    setIsRunning(false);
    setCompleted(false);
    startTimeRef.current = null;
  }, [goalMinutes]);

  const finishSession = useCallback(() => {
    const now = new Date();
    const startedAt = startTimeRef.current || now;
    const actualMs = now.getTime() - startedAt.getTime();
    const actualMinutes = Math.round(actualMs / 60000);

    const category = selectedTask
      ? selectedTask.category
      : undefined;

    const session: FocusSessionRecord = {
      id: Date.now().toString(),
      date: getLocalDateString(),
      taskId: selectedTask?.id,
      taskTitle: selectedTask?.title,
      category,
      goalMinutes,
      actualMinutes: Math.max(1, actualMinutes),
      startedAt: startedAt.toISOString(),
      finishedAt: now.toISOString(),
    };

    saveFocusSession(session);
    const newCount = incrementFocusCycle();
    setCyclesCompleted(newCount);
    if (newCount >= 4) {
      setShowCycleComplete(true);
    }
  }, [goalMinutes, selectedTask]);

  useEffect(() => {
    if (!isRunning) return;
    if (!startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompleted(true);
          finishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, finishSession]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return "";
    const cat = allCategories.find((c) => c.id === catId);
    return cat?.label || "";
  };

  // 4 cycles complete screen
  if (showCycleComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center animate-scale-in">
          <Trophy size={72} className="mx-auto mb-6 text-warning" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Foco Diário Concluído! 🎉</h2>
          <p className="text-muted-foreground mb-2">Você completou 4 ciclos Pomodoro hoje!</p>
          <p className="text-sm text-muted-foreground mb-8">
            Total: {todayFocus}min de foco • Hora de uma pausa longa (15-30min)
          </p>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full fokko-gradient flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{i}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCycleComplete(false)}
            className="mt-8 rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Clean mode
  if (isRunning) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        {selectedTask && (
          <div className="mb-6 text-center animate-fade-in">
            <p className="text-xs text-muted-foreground">Focando em</p>
            <p className="text-sm font-medium text-foreground mt-1">{selectedTask.title}</p>
            {selectedTask.category && (
              <p className="text-xs text-primary mt-0.5">{getCategoryLabel(selectedTask.category)}</p>
            )}
          </div>
        )}
        <div className="relative mx-auto mb-10 flex h-72 w-72 items-center justify-center animate-scale-in">
          <svg className="absolute inset-0" viewBox="0 0 288 288">
            <circle cx="144" cy="144" r="132" fill="none" stroke="hsl(220 18% 18%)" strokeWidth="5" />
            <circle
              cx="144" cy="144" r="132" fill="none"
              stroke="hsl(210 80% 55%)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 132}
              strokeDashoffset={2 * Math.PI * 132 * (1 - progress / 100)}
              className="transition-all duration-1000"
              transform="rotate(-90 144 144)"
            />
          </svg>
          <div className="text-center timer-pulse">
            <div className="text-6xl font-bold tabular-nums text-foreground">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsRunning(false)}
          className="flex h-16 w-16 items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow transition-transform active:scale-95 animate-fade-in"
          style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
        >
          <Pause size={28} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <div className="mx-auto max-w-md px-5 pt-12">
        <div className="mb-8 text-center fade-up">
          <h1 className="text-2xl font-bold text-foreground">Modo Foco</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hoje: {todayFocus}min de foco</p>
        </div>

        {/* Task selector */}
        <div className="mb-6 fade-up">
          <button
            onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="w-full flex items-center justify-between rounded-xl bg-secondary px-4 py-3.5 text-sm transition-all active:scale-[0.98]"
          >
            <span className={selectedTask ? "text-foreground" : "text-muted-foreground"}>
              {selectedTask ? `🎯 ${selectedTask.title}` : "Vincular a uma tarefa (opcional)"}
            </span>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showTaskPicker ? "rotate-180" : ""}`} />
          </button>
          {showTaskPicker && (
            <div className="mt-2 fokko-card p-3 space-y-1 expand-in max-h-48 overflow-y-auto">
              <button
                onClick={() => { setSelectedTask(null); setShowTaskPicker(false); }}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors active:bg-secondary ${!selectedTask ? "text-primary" : "text-muted-foreground"}`}
              >
                Nenhuma tarefa
              </button>
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => { setSelectedTask(task); setShowTaskPicker(false); }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors active:bg-secondary ${selectedTask?.id === task.id ? "text-primary" : "text-foreground"}`}
                >
                  {task.title}
                  <span className="ml-2 text-xs text-muted-foreground">{getCategoryLabel(task.category)}</span>
                </button>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">Nenhuma tarefa pendente</p>
              )}
            </div>
          )}
        </div>

        {/* Timer Circle */}
        <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center fade-up">
          <svg className="absolute inset-0" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="116" fill="none" stroke="hsl(220 18% 18%)" strokeWidth="6" />
            <circle
              cx="128" cy="128" r="116" fill="none"
              stroke={completed ? "hsl(142 70% 45%)" : "hsl(210 80% 55%)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 116}
              strokeDashoffset={2 * Math.PI * 116 * (1 - progress / 100)}
              className="transition-all duration-1000"
              transform="rotate(-90 128 128)"
            />
          </svg>
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-foreground">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {completed ? "✅ Meta atingida!" : `Meta: ${goalMinutes}min`}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex items-center justify-center gap-5 fade-up">
          <button onClick={reset} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors active:text-foreground active:scale-95">
            <RotateCcw size={22} />
          </button>
          <button
            onClick={() => setIsRunning(true)}
            className="flex items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow transition-transform active:scale-95"
            style={{ height: '72px', width: '72px' }}
          >
            <Play size={30} className="ml-1" />
          </button>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors active:text-foreground active:scale-95"
          >
            <Info size={22} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6 fade-up">
          <p className="mb-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo de foco</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {presets.map((min) => (
              <button
                key={min}
                onClick={() => { setGoalMinutes(min); setShowCustomInput(false); }}
                className={`rounded-xl px-5 py-3 text-sm font-medium transition-all active:scale-95 ${
                  goalMinutes === min && !showCustomInput ? "fokko-gradient text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
                }`}
              >
                {min}min
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-95 ${showCustomInput ? "fokko-gradient text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}
            >
              <Plus size={18} />
            </button>
          </div>
          {showCustomInput && (
            <div className="mt-3 flex justify-center gap-2">
              <input
                type="number" min={1} max={180} value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTime) {
                    const val = Math.min(180, Math.max(1, parseInt(customTime)));
                    setGoalMinutes(val);
                    setShowCustomInput(false);
                    setCustomTime("");
                  }
                }}
                placeholder="Min..."
                className="w-24 rounded-lg border border-border bg-secondary px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-center"
              />
              <button
                onClick={() => {
                  if (customTime) {
                    const val = Math.min(180, Math.max(1, parseInt(customTime)));
                    setGoalMinutes(val);
                    setShowCustomInput(false);
                    setCustomTime("");
                  }
                }}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Cycle indicators */}
        <div className="mb-6 fade-up">
          <p className="mb-2 text-center text-xs text-muted-foreground">Ciclos hoje: {cyclesCompleted}/4</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-3 w-3 rounded-full transition-all ${i <= cyclesCompleted ? "fokko-gradient" : "bg-secondary"}`} />
            ))}
          </div>
        </div>

        {showGuide && (
          <div className="fokko-card p-5 fade-up">
            <h3 className="mb-2 text-sm font-semibold text-foreground">🍅 Técnica Pomodoro</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>1. Escolha uma tarefa para trabalhar</li>
              <li>2. Configure o timer (25min é o padrão)</li>
              <li>3. Trabalhe focado até o timer acabar</li>
              <li>4. Faça uma pausa curta (5min)</li>
              <li>5. A cada 4 ciclos, faça uma pausa longa (15-30min)</li>
            </ul>
            <p className="mt-3 text-xs text-primary">
              Benefícios: reduz distrações, melhora a concentração e combate a procrastinação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusPage;
