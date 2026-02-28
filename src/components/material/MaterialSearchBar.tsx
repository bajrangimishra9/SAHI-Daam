import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

const quickSuggestions = [
  "Cement PPC 50kg",
  "TMT 12mm",
  "M-sand",
  "Bricks fly ash",
  "Electrical cables",
  "Recycled aggregates",
];

export default function MaterialSearchBar() {
  const [q, setQ] = useState("");
  const suggestion = useMemo(() => {
    if (q.trim().length > 0) return null;
    return quickSuggestions[Math.floor((Date.now() / 1000) % quickSuggestions.length)];
  }, [q]);

  return (
    <div className="rounded-2xl border bg-card/70 p-3 shadow-elevated backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={suggestion ?? "Search materials, grades, brands..."}
            className="h-11 pl-9"
            aria-label="Search materials"
          />
        </div>
        <Button asChild variant="hero" size="lg" className="h-11">
          <Link to="/auth/role">Smart Search</Link>
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickSuggestions.slice(0, 5).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQ(s)}
            className="rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
