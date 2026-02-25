import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { loadDemoStore, saveDemoStore } from "@/demo/store";
import { useState } from "react";

export default function DocumentUploader({ docType, onUploaded }: { docType: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const store = loadDemoStore();
      store.supplier.documents = [
        {
          id: crypto.randomUUID(),
          doc_type: docType,
          file_name: safeName,
          created_at: new Date().toISOString(),
        },
        ...store.supplier.documents,
      ];
      saveDemoStore(store);

      toast({ title: "Uploaded", description: `${docType} uploaded.` });
      onUploaded();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        disabled={uploading}
        onChange={(e) => {
          void onPick(e.target.files?.[0] ?? null);
          e.currentTarget.value = "";
        }}
      />
      <Button type="button" variant="soft" disabled>
        {uploading ? "Uploading…" : "Select file"}
      </Button>
    </div>
  );
}
