import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

interface User {
  id: string;
  email: string;
}

interface AuthHeaderProps {
  user: User | null;
}

export function AuthHeader({ user }: AuthHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <a
            href={user ? "/generate" : "/"}
            className="text-xl font-semibold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            10x Cards
          </a>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <a
                  href="/generate"
                  className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
                >
                  Generuj fiszki
                </a>
                <ThemeToggle />

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="true"
                    aria-label="Menu użytkownika"
                  >
                    <Avatar email={user.email} />
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover shadow-lg z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Konto użytkownika</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:bg-accent"
                          role="menuitem"
                        >
                          Wyloguj się
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="ghost" size="sm" asChild>
                  <a href="/auth/login">Zaloguj się</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="/auth/register">Rejestracja</a>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

