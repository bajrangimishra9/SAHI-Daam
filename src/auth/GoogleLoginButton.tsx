import { supabase } from "@/supabaseClient";

export default function GoogleLoginButton() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
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
