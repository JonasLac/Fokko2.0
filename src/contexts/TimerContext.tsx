import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import {
  saveFocusSession,
  incrementFocusCycle,
  getLocalDateString,
  type Task,
  type FocusSessionRecord,
} from "@/lib/fokko-data";
import { playTimerDone } from "@/lib/sounds";
import { notifyFocusComplete } from "@/lib/notifications";

export type TimerMode = "timer" | "stopwatch";
export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  goalMinutes: number;
  elapsedSeconds: number;
  secondsLeft: number;
  linkedTask: Task | null;
}

interface TimerContextValue extends TimerState {
  setMode: (m: TimerMode) => void;
  setGoalMinutes: (m: number) => void;
  setLinkedTask: (t: Task | null) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stopStopwatch: () => void; // stops stopwatch, returns elapsed
  finishAndSave: (taskOverride?: Task | null) => void;
  cyclesCompleted: number;
  showCycleComplete: boolean;
  dismissCycleComplete: () => void;
  // For stopwatch confirmation dialog
  pendingStopwatchSession: { minutes: number } | null;
  confirmStopwatchSave: (task: Task | null) => void;
  cancelStopwatchSave: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be inside TimerProvider");
  return ctx;
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<TimerMode>("timer");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [goalMinutes, setGoalMinutesState] = useState(25);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [linkedTask, setLinkedTask] = useState<Task | null>(null);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [showCycleComplete, setShowCycleComplete] = useState(false);
  const [pendingStopwatchSession, setPendingStopwatchSession] = useState<{ minutes: number } | null>(null);

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setGoalMinutes = useCallback((m: number) => {
    setGoalMinutesState(m);
    setSecondsLeft(m * 60);
    setElapsedSeconds(0);
    setStatus("idle");
    startTimeRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const saveSession = useCallback((actualMinutes: number, task: Task | null) => {
    const now = new Date();
    const session: FocusSessionRecord = {
      id: Date.now().toString(),
      date: getLocalDateString(),
      taskId: task?.id,
      taskTitle: task?.title,
      category: task?.category,
      goalMinutes: mode === "stopwatch" ? actualMinutes : goalMinutes,
      actualMinutes: Math.max(1, actualMinutes),
      startedAt: (startTimeRef.current || now).toISOString(),
      finishedAt: now.toISOString(),
    };
    saveFocusSession(session);
    const newCount = incrementFocusCycle();
    setCyclesCompleted(newCount);
    if (newCount >= 4) setShowCycleComplete(true);
  }, [mode, goalMinutes]);

  const start = useCallback(() => {
    startTimeRef.current = new Date();
    setElapsedSeconds(0);
    if (mode === "timer") {
      setSecondsLeft(goalMinutes * 60);
    }
    setStatus("running");
  }, [mode, goalMinutes]);

  const pause = useCallback(() => {
    setStatus("paused");
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setStatus("running");
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setElapsedSeconds(0);
    setSecondsLeft(goalMinutes * 60);
    startTimeRef.current = null;
    setPendingStopwatchSession(null);
  }, [clearTimer, goalMinutes]);

  const finishAndSave = useCallback((taskOverride?: Task | null) => {
    clearTimer();
    const now = new Date();
    const startedAt = startTimeRef.current || now;
    const actualMs = now.getTime() - startedAt.getTime();
    const actualMinutes = Math.round(actualMs / 60000);
    const task = taskOverride !== undefined ? taskOverride : linkedTask;
    saveSession(Math.max(1, actualMinutes), task);
    setStatus("finished");
  }, [clearTimer, linkedTask, saveSession]);

  const stopStopwatch = useCallback(() => {
    clearTimer();
    const mins = Math.max(1, Math.round(elapsedSeconds / 60));
    setPendingStopwatchSession({ minutes: mins });
    setStatus("paused");
  }, [clearTimer, elapsedSeconds]);

  const confirmStopwatchSave = useCallback((task: Task | null) => {
    if (!pendingStopwatchSession) return;
    const now = new Date();
    const session: FocusSessionRecord = {
      id: Date.now().toString(),
      date: getLocalDateString(),
      taskId: task?.id,
      taskTitle: task?.title,
      category: task?.category,
      goalMinutes: pendingStopwatchSession.minutes,
      actualMinutes: pendingStopwatchSession.minutes,
      startedAt: (startTimeRef.current || now).toISOString(),
      finishedAt: now.toISOString(),
    };
    saveFocusSession(session);
    const newCount = incrementFocusCycle();
    setCyclesCompleted(newCount);
    if (newCount >= 4) setShowCycleComplete(true);
    setPendingStopwatchSession(null);
    setStatus("idle");
    setElapsedSeconds(0);
    startTimeRef.current = null;
  }, [pendingStopwatchSession]);

  const cancelStopwatchSave = useCallback(() => {
    setPendingStopwatchSession(null);
    setStatus("idle");
    setElapsedSeconds(0);
    setSecondsLeft(goalMinutes * 60);
    startTimeRef.current = null;
  }, [goalMinutes]);

  const dismissCycleComplete = useCallback(() => setShowCycleComplete(false), []);

  // Tick effect
  useEffect(() => {
    if (status !== "running") {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (mode === "timer") {
        setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Timer finished
              setStatus("finished");
              playTimerDone();
              notifyFocusComplete(goalMinutes);
            const now = new Date();
            const startedAt = startTimeRef.current || now;
            const actualMs = now.getTime() - startedAt.getTime();
            const actualMinutes = Math.round(actualMs / 60000);
            // We need to save inline since callbacks may be stale
            const session: FocusSessionRecord = {
              id: Date.now().toString(),
              date: getLocalDateString(),
              taskId: linkedTask?.id,
              taskTitle: linkedTask?.title,
              category: linkedTask?.category,
              goalMinutes,
              actualMinutes: Math.max(1, actualMinutes),
              startedAt: startedAt.toISOString(),
              finishedAt: now.toISOString(),
            };
            saveFocusSession(session);
            const newCount = incrementFocusCycle();
            setCyclesCompleted(newCount);
            if (newCount >= 4) setShowCycleComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearTimer();
  }, [status, mode, clearTimer, linkedTask, goalMinutes]);

  const value: TimerContextValue = {
    mode, status, goalMinutes, elapsedSeconds, secondsLeft, linkedTask,
    setMode, setGoalMinutes, setLinkedTask, start, pause, resume, reset,
    stopStopwatch, finishAndSave, cyclesCompleted, showCycleComplete,
    dismissCycleComplete, pendingStopwatchSession, confirmStopwatchSave,
    cancelStopwatchSave,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
