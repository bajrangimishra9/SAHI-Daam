import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient";
import { useState } from "react";

export default function DocumentUploader({
  docType,
  onUploaded,
  allowMultiple = false,
  allowMaterialName = false,
}: {
  docType: string;
  onUploaded: () => void;
  allowMultiple?: boolean;
  allowMaterialName?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [materialName, setMaterialName] = useState("");

  const uploadToSupabase = async () => {
    if (!files || files.length === 0) {
      toast({ title: "Select file(s) first", variant: "destructive" });
      return;
    }

    if (allowMaterialName && !materialName.trim()) {
      toast({
        title: "Enter material name",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // 🔐 Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // 👤 Fetch full name from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const fullName =
        profile?.full_name?.replace(/[^a-zA-Z0-9._-]/g, "_") || user.id;

      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        let filePath = "";

        if (
          docType === "material_certificate" &&
          allowMaterialName &&
          materialName.trim() !== ""
        ) {
          const safeMaterial = materialName.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

          filePath = `${fullName}/${docType}/${safeMaterial}/${Date.now()}_${safeName}`;
        } else {
          filePath = `${fullName}/${docType}/${Date.now()}_${safeName}`;
        }

        // 📤 Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from("supplier-files")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 🔗 Get public URL
        const { data: urlData } = supabase.storage
          .from("supplier-files")
          .getPublicUrl(filePath);

        const publicUrl = urlData?.publicUrl ?? "";

        // 📝 Insert metadata with user_id
        const { error: dbError } = await supabase
          .from("supplier_documents")
          .insert([
            {
              file_url: publicUrl,
              document_type: docType,
              material_name:
                docType === "material_certificate"
                  ? materialName
                  : null,
              original_file_name: file.name,
              user_id: user.id, // ✅ CRITICAL
            },
          ]);

        if (dbError) throw dbError;
      }

      toast({
        title: "Uploaded successfully",
        description: `${files.length} file(s) uploaded.`,
      });

      setFiles(null);
      setMaterialName("");
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
    <div className="space-y-3">
      {allowMaterialName && (
        <Input
          placeholder="Material name (e.g., Steel, Cement)"
          value={materialName}
          onChange={(e) => setMaterialName(e.target.value)}
        />
      )}

      <div className="flex items-center gap-3">
        <Input
          type="file"
          multiple={allowMultiple}
          accept=".png,.jpg,.jpeg,.pdf,.ppt,.pptx,.doc,.docx"
          disabled={uploading}
          onChange={(e) => setFiles(e.target.files)}
        />

        <Button
          type="button"
          variant="soft"
          disabled={uploading || !files || files.length === 0}
          onClick={() => void uploadToSupabase()}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}