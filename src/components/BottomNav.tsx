import { Home, Clock, BarChart3, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { isFocusEnabled } from "@/lib/fokko-data";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const focusOn = isFocusEnabled();

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Clock, label: "Foco", path: "/focus" },
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    ...(focusOn ? [{ icon: History, label: "Histórico", path: "/history" }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-300 active:scale-95 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="transition-all duration-300" />
              <span className="text-[10px] font-medium transition-all duration-300">{item.label}</span>
              {isActive && (
                <div className="h-1 w-1 rounded-full bg-primary animate-scale-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
