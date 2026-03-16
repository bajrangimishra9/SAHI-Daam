import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

const wastageDefaults = [
  { material: "Concrete", value: 10 },
  { material: "Steel Reinforcement", value: 10 },
  { material: "Bricks / Blocks", value: 10 },
  { material: "Formwork", value: 0 },
  { material: "Sand & Aggregate", value: 10 },
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure wastage factors, units, and material rates</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="font-semibold">Wastage Percentages</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {wastageDefaults.map(w => (
            <div key={w.material} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{w.material}</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" defaultValue={w.value} className="font-mono" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="font-semibold">API Configuration</h2>
        <p className="text-xs text-muted-foreground">Connect to your FastAPI backend for CAD processing</p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Backend API URL</Label>
          <Input placeholder="https://api.quantifycad.com/v1" className="font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">API Key</Label>
          <Input type="password" placeholder="sk-..." className="font-mono text-sm" />
        </div>
      </motion.div>

      <Button onClick={() => toast.success("Settings saved")} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
        Save Settings
      </Button>
    </div>
  );
}
