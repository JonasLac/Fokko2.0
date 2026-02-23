import { useLocation, useNavigate } from "react-router-dom";
import { Clock, Timer } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";

const FloatingTimer = () => {
  const { status, mode, secondsLeft, elapsedSeconds } = useTimer();
  const location = useLocation();
  const navigate = useNavigate();

  // Only show when timer is active AND user is NOT on focus page
  const isActive = status === "running" || status === "paused";
  const isOnFocus = location.pathname === "/focus";

  if (!isActive || isOnFocus) return null;

  const displaySeconds = mode === "timer" ? secondsLeft : elapsedSeconds;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  return (
    <button
      onClick={() => navigate("/focus")}
      className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full bg-card border border-border px-3.5 py-2 shadow-lg backdrop-blur-xl animate-slide-down"
      style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}
    >
      <div className={`h-2 w-2 rounded-full ${status === "running" ? "bg-success animate-pulse" : "bg-warning"}`} />
      {mode === "timer" ? <Clock size={14} className="text-primary" /> : <Timer size={14} className="text-primary" />}
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </button>
  );
};

export default FloatingTimer;
