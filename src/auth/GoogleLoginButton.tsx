import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";

export default function GoogleLoginButton() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return <Button onClick={login}>Continue with Google</Button>;
}
