import { useState } from "react";
import { Play, Pause, RotateCcw, Info, Trophy, Plus, ChevronDown, Clock, Timer, Square, Check } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import {
  getFocusCycles,
  getTodayFocusMinutes,
  loadTasks,
  getAllCategories,
  type Task,
} from "@/lib/fokko-data";

const presets = [15, 25, 45, 60];

const FocusPage = () => {
  const timer = useTimer();
  const [showGuide, setShowGuide] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [stopwatchTask, setStopwatchTask] = useState<Task | null>(null);
  const [showStopwatchTaskPicker, setShowStopwatchTaskPicker] = useState(false);

  const tasks = loadTasks().filter((t) => !t.completed);
  const allCategories = getAllCategories();
  const todayFocus = getTodayFocusMinutes();
  const cyclesFromStorage = getFocusCycles().count;
  const cyclesCompleted = timer.cyclesCompleted || cyclesFromStorage;

  const isTimer = timer.mode === "timer";
  const totalSeconds = timer.goalMinutes * 60;
  const displaySeconds = isTimer ? timer.secondsLeft : timer.elapsedSeconds;
  const progress = isTimer
    ? ((totalSeconds - timer.secondsLeft) / totalSeconds) * 100
    : Math.min(100, (timer.elapsedSeconds / (timer.goalMinutes * 60)) * 100);

  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return "";
    return allCategories.find((c) => c.id === catId)?.label || "";
  };

  // 4 cycles complete
  if (timer.showCycleComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center animate-scale-in">
          <Trophy size={72} className="mx-auto mb-6 text-warning" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Foco Diário Concluído! 🎉</h2>
          <p className="text-muted-foreground mb-2">Você completou 4 ciclos hoje!</p>
          <p className="text-sm text-muted-foreground mb-8">Total: {todayFocus}min de foco</p>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full fokko-gradient flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{i}</span>
              </div>
            ))}
          </div>
          <button onClick={timer.dismissCycleComplete} className="mt-8 rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-foreground active:scale-95">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Stopwatch confirmation dialog
  if (timer.pendingStopwatchSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="fokko-card p-6 w-full max-w-sm text-center animate-scale-in">
          <Timer size={48} className="mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold text-foreground mb-1">Sessão encerrada</h2>
          <p className="text-3xl font-bold text-foreground mb-1 tabular-nums">{timer.pendingStopwatchSession.minutes}min</p>
          <p className="text-sm text-muted-foreground mb-6">Deseja salvar como sessão de foco?</p>

          {/* Task picker for stopwatch save */}
          <div className="mb-4">
            <button
              onClick={() => setShowStopwatchTaskPicker(!showStopwatchTaskPicker)}
              className="w-full flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm"
            >
              <span className={stopwatchTask ? "text-foreground" : "text-muted-foreground"}>
                {stopwatchTask ? `🎯 ${stopwatchTask.title}` : "Vincular tarefa (opcional)"}
              </span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showStopwatchTaskPicker ? "rotate-180" : ""}`} />
            </button>
            {showStopwatchTaskPicker && (
              <div className="mt-2 fokko-card p-2 space-y-0.5 max-h-36 overflow-y-auto">
                <button onClick={() => { setStopwatchTask(null); setShowStopwatchTaskPicker(false); }} className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-muted-foreground active:bg-secondary">
                  Nenhuma
                </button>
                {tasks.map((t) => (
                  <button key={t.id} onClick={() => { setStopwatchTask(t); setShowStopwatchTaskPicker(false); }} className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-foreground active:bg-secondary">
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={timer.cancelStopwatchSave} className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium text-muted-foreground active:scale-95">
              Descartar
            </button>
            <button onClick={() => timer.confirmStopwatchSave(stopwatchTask)} className="flex-1 rounded-xl fokko-gradient py-3 text-sm font-medium text-primary-foreground active:scale-95">
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Clean mode (running or paused)
  if (timer.status === "running" || timer.status === "paused") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        {timer.linkedTask && (
          <div className="mb-6 text-center animate-fade-in">
            <p className="text-xs text-muted-foreground">Focando em</p>
            <p className="text-sm font-medium text-foreground mt-1">{timer.linkedTask.title}</p>
          </div>
        )}

        {/* Mode badge */}
        <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
          {isTimer ? <Clock size={12} className="text-primary" /> : <Timer size={12} className="text-primary" />}
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isTimer ? "Temporizador" : "Cronômetro"}
          </span>
        </div>

        <div className="relative mx-auto mb-10 flex h-72 w-72 items-center justify-center animate-scale-in">
          <svg className="absolute inset-0" viewBox="0 0 288 288">
            <circle cx="144" cy="144" r="132" fill="none" stroke="hsl(220 18% 15%)" strokeWidth="5" />
            {isTimer && (
              <circle
                cx="144" cy="144" r="132" fill="none"
                stroke="hsl(210 80% 55%)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 132}
                strokeDashoffset={2 * Math.PI * 132 * (1 - progress / 100)}
                className="transition-all duration-1000"
                transform="rotate(-90 144 144)"
              />
            )}
          </svg>
          <div className="text-center">
            <div className={`text-6xl font-bold tabular-nums text-foreground ${timer.status === "running" ? "timer-pulse" : ""}`}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            {timer.status === "paused" && (
              <p className="text-xs text-warning mt-2 font-medium">Pausado</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stop / finish */}
          {!isTimer && (
            <button onClick={timer.stopStopwatch} className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 text-destructive active:scale-95">
              <Square size={22} />
            </button>
          )}

          {timer.status === "running" ? (
            <button onClick={timer.pause} className="flex h-16 w-16 items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow active:scale-95">
              <Pause size={28} />
            </button>
          ) : (
            <button onClick={timer.resume} className="flex h-16 w-16 items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow active:scale-95">
              <Play size={28} className="ml-1" />
            </button>
          )}

          <button onClick={timer.reset} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-95">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Finished state for timer mode
  if (timer.status === "finished" && isTimer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center animate-scale-in">
          <Check size={64} className="mx-auto mb-4 text-success" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sessão concluída! ✅</h2>
          <p className="text-muted-foreground mb-6">{timer.goalMinutes}min de foco registrados</p>
          <button onClick={timer.reset} className="rounded-xl fokko-gradient px-8 py-3 text-sm font-medium text-primary-foreground active:scale-95">
            Nova sessão
          </button>
        </div>
      </div>
    );
  }

  // Idle — setup screen
  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <div className="mx-auto max-w-md px-5 pt-12">
        <div className="mb-6 text-center fade-up">
          <h1 className="text-2xl font-bold text-foreground">Modo Foco</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hoje: {todayFocus}min de foco</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex justify-center fade-up">
          <div className="flex rounded-xl bg-secondary p-1 gap-1">
            <button
              onClick={() => timer.setMode("timer")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isTimer ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Clock size={15} />
              Timer
            </button>
            <button
              onClick={() => timer.setMode("stopwatch")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                !isTimer ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Timer size={15} />
              Cronômetro
            </button>
          </div>
        </div>

        {/* Task selector */}
        <div className="mb-6 fade-up">
          <button
            onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="w-full flex items-center justify-between rounded-xl bg-secondary px-4 py-3.5 text-sm active:scale-[0.98]"
          >
            <span className={timer.linkedTask ? "text-foreground" : "text-muted-foreground"}>
              {timer.linkedTask ? `🎯 ${timer.linkedTask.title}` : "Vincular tarefa (opcional)"}
            </span>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showTaskPicker ? "rotate-180" : ""}`} />
          </button>
          {showTaskPicker && (
            <div className="mt-2 fokko-card p-3 space-y-1 expand-in max-h-48 overflow-y-auto">
              <button onClick={() => { timer.setLinkedTask(null); setShowTaskPicker(false); }} className={`w-full text-left rounded-lg px-3 py-2.5 text-sm active:bg-secondary ${!timer.linkedTask ? "text-primary" : "text-muted-foreground"}`}>
                Nenhuma tarefa
              </button>
              {tasks.map((task) => (
                <button key={task.id} onClick={() => { timer.setLinkedTask(task); setShowTaskPicker(false); }} className={`w-full text-left rounded-lg px-3 py-2.5 text-sm active:bg-secondary ${timer.linkedTask?.id === task.id ? "text-primary" : "text-foreground"}`}>
                  {task.title}
                  <span className="ml-2 text-xs text-muted-foreground">{getCategoryLabel(task.category)}</span>
                </button>
              ))}
              {tasks.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">Nenhuma tarefa pendente</p>}
            </div>
          )}
        </div>

        {/* Timer Circle */}
        <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center fade-up">
          <svg className="absolute inset-0" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="116" fill="none" stroke="hsl(220 18% 15%)" strokeWidth="6" />
          </svg>
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-foreground">
              {isTimer
                ? `${String(Math.floor(timer.secondsLeft / 60)).padStart(2, "0")}:${String(timer.secondsLeft % 60).padStart(2, "0")}`
                : "00:00"
              }
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isTimer ? `Meta: ${timer.goalMinutes}min` : "Pronto para iniciar"}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div className="mb-8 flex items-center justify-center gap-5 fade-up">
          <button onClick={timer.reset} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-95">
            <RotateCcw size={22} />
          </button>
          <button
            onClick={timer.start}
            className="flex items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow active:scale-95"
            style={{ height: "72px", width: "72px" }}
          >
            <Play size={30} className="ml-1" />
          </button>
          <button onClick={() => setShowGuide(!showGuide)} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-95">
            <Info size={22} />
          </button>
        </div>

        {/* Timer presets (only for timer mode) */}
        {isTimer && (
          <div className="mb-6 fade-up">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo de foco</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {presets.map((min) => (
                <button
                  key={min}
                  onClick={() => { timer.setGoalMinutes(min); setShowCustomInput(false); }}
                  className={`rounded-xl px-5 py-3 text-sm font-medium active:scale-95 ${
                    timer.goalMinutes === min && !showCustomInput ? "fokko-gradient text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {min}min
                </button>
              ))}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`rounded-xl px-4 py-3 text-sm font-medium active:scale-95 ${showCustomInput ? "fokko-gradient text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}
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
                      timer.setGoalMinutes(Math.min(180, Math.max(1, parseInt(customTime))));
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
                      timer.setGoalMinutes(Math.min(180, Math.max(1, parseInt(customTime))));
                      setShowCustomInput(false);
                      setCustomTime("");
                    }
                  }}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground active:scale-95"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        )}

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
              <li>5. A cada 4 ciclos, pausa longa (15-30min)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusPage;
