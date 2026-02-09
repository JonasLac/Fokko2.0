import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Info } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const FOCUS_KEY = "fokko-focus-history";

interface FocusSession {
  date: string;
  minutes: number;
}

const loadFocusHistory = (): FocusSession[] => {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveFocusSession = (minutes: number) => {
  const history = loadFocusHistory();
  const today = new Date().toISOString().split("T")[0];
  const existing = history.find((s) => s.date === today);
  if (existing) {
    existing.minutes += minutes;
  } else {
    history.push({ date: today, minutes });
  }
  localStorage.setItem(FOCUS_KEY, JSON.stringify(history));
};

const presets = [15, 25, 45, 60];

const FocusPage = () => {
  const [goalMinutes, setGoalMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalSeconds = goalMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(goalMinutes * 60);
    setCompleted(false);
  }, [goalMinutes]);

  useEffect(() => {
    setSecondsLeft(goalMinutes * 60);
    setIsRunning(false);
    setCompleted(false);
  }, [goalMinutes]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompleted(true);
          saveFocusSession(goalMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, goalMinutes]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const todayHistory = loadFocusHistory();
  const today = new Date().toISOString().split("T")[0];
  const todayFocus = todayHistory.find((s) => s.date === today)?.minutes || 0;

  // Clean mode: when running, show only timer + pause
  if (isRunning) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        {/* Timer Circle */}
        <div className="relative mx-auto mb-10 flex h-72 w-72 items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 288 288">
            <circle cx="144" cy="144" r="132" fill="none" stroke="hsl(220 18% 18%)" strokeWidth="5" />
            <circle
              cx="144"
              cy="144"
              r="132"
              fill="none"
              stroke="hsl(210 80% 55%)"
              strokeWidth="5"
              strokeLinecap="round"
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

        {/* Pause button only */}
        <button
          onClick={() => setIsRunning(false)}
          className="flex h-16 w-16 items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow transition-transform hover:scale-105"
        >
          <Pause size={28} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        {/* Header */}
        <div className="mb-8 text-center fade-up">
          <h1 className="text-2xl font-bold text-foreground">Modo Foco</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoje: {todayFocus}min de foco
          </p>
        </div>

        {/* Timer Circle */}
        <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center fade-up">
          <svg className="absolute inset-0" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="116" fill="none" stroke="hsl(220 18% 18%)" strokeWidth="6" />
            <circle
              cx="128"
              cy="128"
              r="116"
              fill="none"
              stroke={completed ? "hsl(142 70% 45%)" : "hsl(210 80% 55%)"}
              strokeWidth="6"
              strokeLinecap="round"
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
        <div className="mb-8 flex items-center justify-center gap-4 fade-up">
          <button
            onClick={reset}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setIsRunning(true)}
            className="flex h-16 w-16 items-center justify-center rounded-full fokko-gradient text-primary-foreground shadow-lg fokko-glow transition-transform hover:scale-105"
          >
            <Play size={28} className="ml-1" />
          </button>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6 fade-up">
          <p className="mb-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tempo de foco
          </p>
          <div className="flex justify-center gap-3">
            {presets.map((min) => (
              <button
                key={min}
                onClick={() => setGoalMinutes(min)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  goalMinutes === min
                    ? "fokko-gradient text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {min}min
              </button>
            ))}
          </div>
        </div>

        {/* Pomodoro Guide */}
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
      <BottomNav />
    </div>
  );
};

export default FocusPage;
