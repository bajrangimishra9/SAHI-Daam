import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">सही दाम</p>
        <h1 className="mt-3 text-balance text-5xl font-bold">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          यह पेज नहीं मिला — कृपया होम पर वापस जाएँ.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <a href="/">Home</a>
          </Button>
          <Button asChild variant="outline" size="xl">
            <a href="/contact">Contact</a>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
