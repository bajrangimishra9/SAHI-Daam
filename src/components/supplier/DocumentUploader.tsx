import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient"; 
import { useState } from "react";

export default function DocumentUploader({
  docType,
  onUploaded,
}: {
  docType: string;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const uploadToSupabase = async () => {
    if (!file) {
      toast({ title: "Select a file first", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${docType}/${Date.now()}_${safeName}`;

      // 1) Upload file to Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("supplier-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2) Get public URL (works if bucket is Public)
      const { data: urlData } = supabase.storage
        .from("supplier-files")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl ?? "";

      // 3) Insert metadata row in DB
      const { error: dbError } = await supabase
        .from("supplier_documents")
        .insert([
          {
            file_url: publicUrl,
            document_type: docType,
          },
        ]);

      if (dbError) throw dbError;

      toast({ title: "Uploaded", description: `${docType} uploaded.` });

      setFile(null);
      onUploaded();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
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
          setFile(e.target.files?.[0] ?? null);
        }}
      />
      <Button
        type="button"
        variant="soft"
        disabled={uploading || !file}
        onClick={() => void uploadToSupabase()}
      >
        {uploading ? "Uploading…" : "Upload"}
      </Button>
    </div>
  );
}
