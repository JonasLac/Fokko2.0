import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getAllCategories, loadTasks, loadCompletionHistory } from "@/lib/fokko-data";

const DashboardPage = () => {
  const tasks = loadTasks();
  const allCategories = getAllCategories();
  const completionHistory = loadCompletionHistory();

  const categoryColors: Record<string, string> = useMemo(() => {
    const colors: Record<string, string> = {
      home: "hsl(25, 95%, 55%)",
      work: "hsl(210, 80%, 55%)",
      study: "hsl(270, 70%, 60%)",
      exercise: "hsl(142, 70%, 45%)",
      personal: "hsl(340, 75%, 55%)",
    };
    allCategories.forEach((cat) => {
      if (cat.color && !colors[cat.id]) {
        colors[cat.id] = `hsl(${cat.color})`;
      }
    });
    return colors;
  }, [allCategories]);

  const pieData = useMemo(() => {
    return allCategories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat.id);
      const completed = catTasks.filter((t) => t.completed).length;
      return { name: cat.label, value: completed, total: catTasks.length, id: cat.id };
    }).filter((d) => d.total > 0);
  }, [tasks, allCategories]);

  const barData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days.map((day, i) => ({
      day,
      tarefas: Math.floor(Math.random() * 8) + 2,
    }));
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Focus history
  const focusHistory = (() => {
    try {
      const raw = localStorage.getItem("fokko-focus-history");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();
  const today = new Date().toISOString().split("T")[0];
  const todayFocus = focusHistory.find((s: any) => s.date === today)?.minutes || 0;

  // Calendar generation
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const isAllComplete = (day: number): boolean => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return completionHistory[dateStr] === true;
  };

  const isToday = (day: number): boolean => {
    return day === currentDate.getDate();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground fade-up stagger-1">Dashboard</h1>
        <p className="mb-6 text-sm text-muted-foreground fade-up stagger-2">Acompanhe seu progresso</p>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3 fade-up stagger-3">
          <div className="fokko-card p-3 text-center">
            <div className="text-2xl font-bold text-gradient">{completionRate}%</div>
            <div className="text-[10px] text-muted-foreground">Concluído</div>
          </div>
          <div className="fokko-card p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{completedTasks}</div>
            <div className="text-[10px] text-muted-foreground">Tarefas feitas</div>
          </div>
          <div className="fokko-card p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{todayFocus}m</div>
            <div className="text-[10px] text-muted-foreground">Foco hoje</div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="fokko-card mb-6 p-5 fade-up stagger-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Tarefas por Categoria</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(220, 25%, 6%)"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={categoryColors[entry.id] || "hsl(210, 50%, 50%)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(220, 22%, 10%)",
                    border: "1px solid hsl(220, 18%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {pieData.map((entry) => (
              <div key={entry.id} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: categoryColors[entry.id] || "hsl(210, 50%, 50%)" }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {entry.name} ({entry.value}/{entry.total})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="fokko-card mb-6 p-5 fade-up stagger-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Desempenho Semanal</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 18%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 18%, 18%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 18%, 18%)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 22%, 10%)",
                  border: "1px solid hsl(220, 18%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 96%)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="tarefas" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210, 80%, 55%)" />
                  <stop offset="100%" stopColor="hsl(210, 90%, 40%)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goals Calendar */}
        <div className="fokko-card mb-6 p-5 fade-up stagger-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">📅 Calendário de Metas</h2>
          <p className="mb-3 text-xs text-muted-foreground capitalize">{monthName}</p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] font-medium text-muted-foreground pb-1">{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <div key={i} className="flex items-center justify-center aspect-square">
                {day !== null ? (
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all ${
                      isToday(day)
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-foreground/70"
                    } ${isAllComplete(day) ? "ring-2 ring-warning" : ""}`}
                  >
                    {day}
                    {isAllComplete(day) && (
                      <Star
                        size={10}
                        className="absolute -top-0.5 -right-0.5 text-warning fill-warning"
                      />
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Star size={10} className="text-warning fill-warning" />
            <span>Todas as metas atingidas</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardPage;
