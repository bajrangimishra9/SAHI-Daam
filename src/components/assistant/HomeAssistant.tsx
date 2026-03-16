import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { buildDemoMarketplace } from "@/demo/marketplace";
import { quoteSupplier } from "@/lib/comparison";
import { isValidPincode } from "@/lib/geo";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

function buildQuickContext() {
  // Lightweight grounding context for the landing page.
  const market = buildDemoMarketplace();
  const vendorPincode = "411001";
  const radiusKm = 50;
  const qty = 50;
  const materialQuery = "cement";
  const prefs = { prioritizePrice: 0.5, prioritizeSpeed: 0.3, prioritizeLowRisk: 0.2 };

  const snapshots = market
    .filter((s) => s.profile.discoverable)
    .flatMap((s) =>
      s.materials
        .filter((m) => m.name.toLowerCase().includes(materialQuery))
        .map((m) => ({
          supplierId: s.id,
          supplierName: s.profile.business_name,
          supplierPincode: s.profile.pincode,
          verification: s.profile.verification,
          rating: s.profile.rating,
          pastClients: s.profile.past_clients,
          docsCount: s.profile.docs_count,
          material: m,
        })),
    )
    .filter((snap) => isValidPincode(snap.supplierPincode));

  const unitPrices = snapshots.map((s) => Number(s.material.unit_base_price ?? 0));
  const marketMinUnitPrice = unitPrices.length ? Math.min(...unitPrices) : 0;
  const marketMaxUnitPrice = unitPrices.length ? Math.max(...unitPrices) : 1;

  const quotes = snapshots
    .map((snap) =>
      quoteSupplier({
        vendorPincode,
        qty,
        snapshot: snap,
        prefs,
        marketMinUnitPrice,
        marketMaxUnitPrice,
      }),
    )
    .filter((q) => q.km <= radiusKm)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((q) => ({
      supplier: q.supplierName,
      km: q.km,
      eta: q.eta,
      total: q.totalLandedCost,
      risk: Math.round(q.riskScore),
      score: Math.round(q.score),
      material: q.materialLabel,
    }));

  return {
    demo_market: {
      delivery_pincode: vendorPincode,
      radius_km: radiusKm,
      default_material_query: materialQuery,
      default_qty: qty,
      top_quotes: quotes,
      supplier_count: market.length,
    },
  };
}

export default function HomeAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about construction materials or sourcing. Example: ‘Compare cement suppliers near Pune for 50 bags’.",
    },
  ]);

  const context = useMemo(() => buildQuickContext(), []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("home-assistant", {
        body: {
          question: q,
          context,
        },
      });
      if (error) throw error;
      const answer = (data as any)?.answer as string | undefined;
      setMessages((m) => [...m, { role: "assistant", content: answer ?? "I couldn’t generate an answer right now." }]);
    } catch (e) {
      toast({
        title: "AI assistant error",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border bg-card/70 p-5 shadow-elevated backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">SAHI दाम AI Assistant</p>
          <p className="text-sm text-muted-foreground">Grounded in live demo marketplace signals</p>
        </div>
        <Badge variant="secondary" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" /> Ask
        </Badge>
      </div>
      <Separator className="my-4" />

      <div className="max-h-64 space-y-3 overflow-auto pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className="rounded-xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">{m.role === "user" ? "You" : "SAHI दाम AI"}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask: best cement for residential construction…"
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(input);
          }}
        />
        <Button variant="hero" disabled={loading} onClick={() => void send(input)}>
          {loading ? "Thinking…" : "Send"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: include pincode + radius + quantities for the most accurate comparison-style answers.
      </p>
    </Card>
  );
}
