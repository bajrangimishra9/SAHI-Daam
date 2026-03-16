import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useUser } from "@/hooks/useUser";

export default function ProfileMenu() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: existing } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!existing) {
        await supabase.from("user_profiles").insert({
          id: user.id,
          role: "client",
          location: "",
        });
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };

    load();
  }, [user]);

  if (!user) return null;

  const name = user.user_metadata?.full_name || "User";
  const email = user.email || "";

  return (
    <div className="relative">
      <button
        className="h-10 w-10 rounded-full border bg-white"
        onClick={() => setOpen((v) => !v)}
      >
        👤
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg">
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-gray-600">{email}</div>

          <div className="mt-3 text-sm">
            <div><b>Role:</b> {profile?.role ?? "client"}</div>
            <div><b>Location:</b> {profile?.location ?? ""}</div>
            <div className="mt-2 break-all text-xs text-gray-500">
              <b>User ID:</b> {user.id}
            </div>
          </div>

          <button
            className="mt-4 w-full rounded bg-red-500 px-3 py-2 text-white"
            onClick={() => supabase.auth.signOut()}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
