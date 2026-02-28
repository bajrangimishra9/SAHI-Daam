import { supabase } from "@/supabaseClient";
import { getSelectedRole } from "@/auth/role-state";

export default function GoogleLoginButton() {
  const login = async () => {
    const role = getSelectedRole() ?? "client";

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    });
  };

  return (
    <button
      onClick={login}
      className="rounded-lg bg-black px-6 py-3 text-white"
    >
      Continue with Google
    </button>
  );
}
