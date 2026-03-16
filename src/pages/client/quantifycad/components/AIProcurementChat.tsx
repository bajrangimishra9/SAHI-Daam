import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import type { BOQItem } from "../lib/mock-data";
import type { ProjectConfig } from "./ProcurementWizard";
import { computeMaterialRequirements } from "../lib/material-calculations";

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  boqItems: BOQItem[];
  config: ProjectConfig;
}

const SUPABASE_URL = import.meta.env.VITE_QCAD_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_QCAD_SUPABASE_PUBLISHABLE_KEY;

export function AIProcurementChat({ boqItems, config }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const matReq = computeMaterialRequirements(boqItems);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const buildContext = useCallback(() => {
    return `You are a construction procurement advisor. Here is the project data:

Project Area: ${config.totalArea} ${config.areaUnit}
Completion: ${config.completionPercent}%
Storage: ${config.hasStorage ? `${config.storageCapacity} sq.m (${config.storageType})` : "None"}
Timeline: ${config.startDate} to ${config.endDate}
Planning Interval: ${config.planningInterval}

Material Requirements:
- Cement: ${matReq.totalCementBags} bags
- Sand: ${matReq.totalSandM3} m³
- Aggregate: ${matReq.totalAggregateM3} m³
- Bricks: ${matReq.totalBricks} nos
- Steel: ${matReq.totalSteelKg} kg
- Water: ${matReq.totalWaterLiters} L

BOQ Summary:
${boqItems
  .map(
    (b) =>
      `- ${b.description}: ${b.quantity} ${b.unit} @ ₹${b.rate}/${b.unit} = ₹${b.amount.toLocaleString()}`
  )
  .join("\n")}

Provide concise, actionable procurement advice. Consider seasonal price trends, monsoon risks, storage constraints, and supply chain factors in India. Use markdown formatting. Recommend specific purchase quantities and timing.`;
  }, [boqItems, config, matReq]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `## 👋 Welcome to AI Procurement Advisor

I've analyzed your project's Bill of Quantities and material requirements. Here's what I can help with:

- **📦 Purchase Planning** — When and how much to buy
- **💰 Price Optimization** — Best times to purchase based on market trends
- **🏗️ Storage Management** — Optimal stock levels for your ${
            config.hasStorage
              ? `${config.storageCapacity} sq.m`
              : "limited"
          } storage
- **⚠️ Risk Alerts** — Monsoon, price hikes, supply disruptions

**Quick questions to get started:**
- "When should I buy cement for best prices?"
- "How much steel should I stock in the first month?"
- "What are the biggest cost-saving opportunities?"

Ask me anything about your procurement strategy!`,
        },
      ]);
    }
  }, [config, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: input.trim() },
        {
          role: "assistant",
          content:
            "Supabase environment variables are missing. Please set `VITE_QCAD_SUPABASE_URL` and `VITE_QCAD_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`).",
        },
      ]);
      setInput("");
      return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > newMessages.length) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/procurement-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            systemContext: buildContext(),
          }),
        }
      );

      if (response.status === 429) {
        updateAssistant(
          "⚠️ Rate limit exceeded. Please try again in a moment."
        );
        return;
      }

      if (response.status === 402) {
        updateAssistant(
          "⚠️ AI credits exhausted. Please add credits in your workspace settings."
        );
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI function error:", response.status, errorText);
        throw new Error(
          `Failed to get AI response: ${response.status} ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body returned from procurement-advisor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();

          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch (err) {
            console.error("Stream parse error:", err, jsonStr);
          }
        }
      }

      if (!assistantContent.trim()) {
        updateAssistant(
          "I received the request, but no answer was returned by the AI service."
        );
      }
    } catch (e) {
      console.error("Chat error full:", e);
      if (!assistantContent) {
        updateAssistant(
          "Sorry, I couldn't process your request. Please check the browser console / network tab for the exact backend error."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl flex flex-col h-[500px]"
    >
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Bot className="h-5 w-5 text-accent" />
        <h3 className="font-bold text-sm">AI Procurement Advisor</h3>
        <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full ml-auto">
          Active
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                msg.role === "assistant"
                  ? "bg-accent/10 text-accent"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-xl p-3 text-sm ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/30 border border-border/50"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-headings:font-bold prose-p:text-sm prose-li:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-accent animate-spin" />
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about procurement strategy, pricing, storage..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}