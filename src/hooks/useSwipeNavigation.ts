import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isFocusEnabled } from "@/lib/fokko-data";

const BASE_ROUTES = ["/", "/focus", "/dashboard"];
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_Y = 80;

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = Math.abs(touch.clientY - touchStart.current.y);
      touchStart.current = null;

      if (dy > SWIPE_MAX_Y || Math.abs(dx) < SWIPE_THRESHOLD) return;

      const focusOn = isFocusEnabled();
      const routes = focusOn ? [...BASE_ROUTES, "/history"] : BASE_ROUTES;

      const currentIndex = routes.indexOf(location.pathname);
      if (currentIndex === -1) return;

      if (dx < -SWIPE_THRESHOLD && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      } else if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    },
    [navigate, location.pathname]
  );

  return { onTouchStart, onTouchEnd };
}
