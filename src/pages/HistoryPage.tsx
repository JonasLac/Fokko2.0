import { useState, useMemo } from "react";
import { Clock, Filter } from "lucide-react";
import {
  loadFocusSessions,
  getAllCategories,
  parseLocalDate,
  type FocusSessionRecord,
} from "@/lib/fokko-data";

const HistoryPage = () => {
  const sessions = loadFocusSessions();
  const allCategories = getAllCategories();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

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

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filterCategory) {
      list = list.filter((s) => s.category === filterCategory);
    }
    list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return list;
  }, [sessions, filterCategory]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, FocusSessionRecord[]>();
    filtered.forEach((s) => {
      const group = map.get(s.date) || [];
      group.push(s);
      map.set(s.date, group);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const formatDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  };

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return "Sem categoria";
    return allCategories.find((c) => c.id === catId)?.label || catId;
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md px-5 pt-12">
        <div className="mb-2 flex items-center justify-between fade-up stagger-1">
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:scale-95 ${
              filterCategory ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
        <p className="mb-6 text-sm text-muted-foreground fade-up stagger-2">Sessões de foco</p>

        {/* Filter */}
        {showFilter && (
          <div className="mb-4 flex gap-2 flex-wrap expand-in">
            <button
              onClick={() => setFilterCategory(null)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                !filterCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Todas
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                  filterCategory === cat.id ? "text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
                style={filterCategory === cat.id ? { background: categoryColors[cat.id] || "hsl(210, 80%, 55%)" } : undefined}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {grouped.length === 0 && (
          <div className="mt-16 text-center fade-up">
            <Clock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Complete um ciclo de foco para ver aqui</p>
          </div>
        )}

        {grouped.map(([date, items]) => (
          <div key={date} className="mb-6 fade-up">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
              {formatDate(date)}
            </h2>
            <div className="space-y-2">
              {items.map((session) => (
                <div key={session.id} className="fokko-card p-4 flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: session.category
                        ? `${categoryColors[session.category] || "hsl(210, 80%, 55%)"}20`
                        : "hsl(220, 18%, 18%)",
                    }}
                  >
                    <Clock
                      size={18}
                      style={{
                        color: session.category
                          ? categoryColors[session.category] || "hsl(210, 80%, 55%)"
                          : "hsl(215, 15%, 55%)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.taskTitle || "Foco livre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getCategoryLabel(session.category)} • {session.actualMinutes}min
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{session.actualMinutes}m</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(session.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
