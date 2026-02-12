import { useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "@/pages/Index";
import FocusPage from "@/pages/FocusPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/NotFound";

const routes = ["/", "/focus", "/dashboard"];
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_Y = 80;

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const directionRef = useRef(1);

  const currentIndex = routes.indexOf(location.pathname);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = Math.abs(touch.clientY - touchStart.current.y);
    touchStart.current = null;

    if (dy > SWIPE_MAX_Y || Math.abs(dx) < SWIPE_THRESHOLD) return;

    const idx = routes.indexOf(location.pathname);
    if (idx === -1) return;

    if (dx < -SWIPE_THRESHOLD && idx < routes.length - 1) {
      directionRef.current = 1;
      navigate(routes[idx + 1]);
    } else if (dx > SWIPE_THRESHOLD && idx > 0) {
      directionRef.current = -1;
      navigate(routes[idx - 1]);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-screen">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default AnimatedRoutes;
