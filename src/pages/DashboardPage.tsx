import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star, Clock, TrendingUp, Flame, Eye, EyeOff } from "lucide-react";

import {
  getAllCategories,
  loadTasks,
  loadCompletionHistory,
  getLocalDateString,
  getWeekFocusMinutes,
  getDailyAverageFocus,
  getTodayFocusMinutes,
  isFocusEnabled,
  setFocusEnabled,
} from "@/lib/fokko-data";
import { calculateStreak } from "@/lib/streak";

// Detect dark mode for chart theming
const isDark = () => !window.matchMedia("(prefers-color-scheme: light)").matches;

const DashboardPage = () => {
  const [focusOn, setFocusOn] = useState(isFocusEnabled);
  const [dark] = useState(isDark);

  const tasks = loadTasks();
  const allCategories = getAllCategories();
  const completionHistory = loadCompletionHistory();
  const streak = useMemo(() => calculateStreak(), []);

  const chartTooltipStyle = {
    background: dark ? "hsl(225, 18%, 8%)" : "hsl(0, 0%, 100%)",
    border: dark ? "1px solid hsl(225, 14%, 14%)" : "1px solid hsl(210, 20%, 86%)",
    borderRadius: "8px",
    color: dark ? "hsl(210, 40%, 96%)" : "hsl(220, 20%, 10%)",
    fontSize: "12px",
  };

  const categoryColors: Record<string, string> = useMemo(() => {
    const colors: Record<string, string> = {
      home: "hsl(25, 95%, 55%)",
      work: "hsl(210, 80%, 55%)",
      study: "hsl(270, 70%, 60%)",
      exercise: "hsl(142, 70%, 45%)",
      personal: "hsl(340, 75%, 55%)",
    };
    allCategories.forEach((cat) => {
      if (cat.color && !colors[cat.id]) colors[cat.id] = `hsl(${cat.color})`;
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
    const today = new Date();
    const todayDow = today.getDay();
    const todayStr = getLocalDateString(today);

    return days.map((day, i) => {
      const diff = i - todayDow;
      const d = new Date(today);
      d.setDate(d.getDate() + diff);
      const dateStr = getLocalDateString(d);

      if (dateStr === todayStr) {
        return { day, tarefas: tasks.filter((t) => t.completed).length };
      }
      if (i < todayDow) {
        return { day, tarefas: completionHistory[dateStr] === true ? (tasks.length || 1) : 0 };
      }
      return { day, tarefas: 0 };
    });
  }, [tasks, completionHistory]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayFocus = focusOn ? getTodayFocusMinutes() : 0;
  const weekFocus = focusOn ? getWeekFocusMinutes() : 0;
  const dailyAvg = focusOn ? getDailyAverageFocus() : 0;

  const handleToggleFocus = () => {
    const next = !focusOn;
    setFocusEnabled(next);
    setFocusOn(next);
    // Notify BottomNav immediately
    window.dispatchEvent(new Event("fokko-focus-changed"));
  };

  const gridStroke = dark ? "hsl(225, 14%, 14%)" : "hsl(210, 20%, 88%)";
  const axisTickFill = dark ? "hsl(215, 12%, 50%)" : "hsl(215, 14%, 45%)";

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

  const isToday = (day: number): boolean => day === currentDate.getDate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md px-5 pt-12">
        <div className="mb-6 flex items-center justify-between fade-up stagger-1">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Acompanhe seu progresso</p>
          </div>
          <button
            onClick={handleToggleFocus}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:scale-95 ${
              focusOn ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}
            title={focusOn ? "Desativar dados de foco" : "Ativar dados de foco"}
          >
            {focusOn ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        {/* Top stats row - focus stats only when enabled */}
        {focusOn && (
          <div className="mb-4 grid grid-cols-3 gap-2.5 fade-up stagger-3">
            <div className="fokko-card p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-primary" />
                <span className="text-[10px] text-muted-foreground">Semana</span>
              </div>
              <div className="text-xl font-bold text-foreground">{weekFocus}m</div>
            </div>
            <div className="fokko-card p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={12} className="text-success" />
                <span className="text-[10px] text-muted-foreground">Média/dia</span>
              </div>
              <div className="text-xl font-bold text-foreground">{dailyAvg}m</div>
            </div>
            <div className="fokko-card p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={12} className="text-warning" />
                <span className="text-[10px] text-muted-foreground">Streak</span>
              </div>
              <div className="text-xl font-bold text-warning">{streak.current}🔥</div>
            </div>
          </div>
        )}

        <div className={`mb-4 grid ${focusOn ? "grid-cols-3" : "grid-cols-2"} gap-2.5 fade-up stagger-4`}>
          <div className="fokko-card p-3 text-center">
            <div className="text-xl font-bold text-gradient">{completionRate}%</div>
            <div className="text-[10px] text-muted-foreground">Concluído</div>
          </div>
          <div className="fokko-card p-3 text-center">
            <div className="text-xl font-bold text-foreground">{completedTasks}</div>
            <div className="text-[10px] text-muted-foreground">Feitas</div>
          </div>
          {focusOn && (
            <div className="fokko-card p-3 text-center">
              <div className="text-xl font-bold text-foreground">{todayFocus}m</div>
              <div className="text-[10px] text-muted-foreground">Foco hoje</div>
            </div>
          )}
        </div>

        {/* Streak detail */}
        {streak.best > 0 && (
          <div className="fokko-card mb-4 p-4 flex items-center justify-between fade-up stagger-4">
            <div className="flex items-center gap-3">
              <Flame size={20} className="text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">Streak atual: {streak.current} dias</p>
                <p className="text-xs text-muted-foreground">Melhor: {streak.best} dias</p>
              </div>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        <div className="fokko-card mb-4 p-5 fade-up stagger-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Tarefas por Categoria</h2>
          {pieData.length > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      dataKey="value"
                      strokeWidth={2}
                      stroke={dark ? "hsl(225, 20%, 5%)" : "hsl(0, 0%, 100%)"}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.id} fill={categoryColors[entry.id] || "hsl(210, 50%, 50%)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value, name) => {
                        const item = pieData.find((d) => d.name === name);
                        return [`${value}/${item?.total ?? value}`, name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {pieData.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: categoryColors[entry.id] || "hsl(210, 50%, 50%)" }} />
                    <span className="text-[10px] text-muted-foreground">{entry.name} ({entry.value}/{entry.total})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-8">Adicione tarefas para ver o gráfico</p>
          )}
        </div>

        {/* Bar Chart */}
        <div className="fokko-card mb-4 p-5 fade-up stagger-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Desempenho Semanal</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="day"
                tick={{ fill: axisTickFill, fontSize: 11 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: axisTickFill, fontSize: 11 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: "transparent" }}
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

        {/* Calendar */}
        <div className="fokko-card mb-4 p-5 fade-up stagger-7">
          <h2 className="mb-4 text-sm font-semibold text-foreground">📅 Calendário de Metas</h2>
          <p className="mb-3 text-xs text-muted-foreground capitalize">{monthName}</p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] font-medium text-muted-foreground pb-1">{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <div key={i} className="flex items-center justify-center aspect-square min-h-[36px]">
                {day !== null ? (
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs ${isToday(day) ? "bg-primary/20 text-primary font-bold" : "text-foreground/70"} ${isAllComplete(day) ? "ring-2 ring-warning" : ""}`}>
                    {day}
                    {isAllComplete(day) && <Star size={8} className="absolute -top-0.5 -right-0.5 text-warning fill-warning" />}
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
    </div>
  );
};

export default DashboardPage;
