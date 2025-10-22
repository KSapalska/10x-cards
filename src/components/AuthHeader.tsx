import { useState, useCallback, useId } from "react";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

interface AuthHeaderProps {
  user?: {
    id: string;
    email?: string;
  } | null;
}

/**
 * AuthHeader component - displays navigation and user info
 * Shows different content based on authentication state:
 * - Logged in: User avatar, email, and logout option
 * - Anonymous: Login and Register buttons
 */
export function AuthHeader({ user }: AuthHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuId = useId();
  const buttonId = useId();

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = "/auth/login";
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Get user initials for avatar
  const getInitials = (email?: string): string => {
    if (!email) return "?";
    if (email.length === 0) return "?";
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <a
            href={user ? "/generate" : "/"}
            className="text-xl font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            10x Cards
          </a>
        </div>

        {/* Right side: Theme toggle + Auth section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            /* Logged in state */
            <div className="relative">
              <button
                id={buttonId}
                onClick={toggleMenu}
                aria-expanded={isMenuOpen}
                aria-controls={menuId}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar className="size-9 bg-primary text-primary-foreground flex items-center justify-center">
                  <span className="text-sm font-medium">{getInitials(user.email)}</span>
                </Avatar>
                <span className="hidden sm:inline text-sm text-foreground max-w-[150px] truncate">
                  {user.email || "User"}
                </span>
                <svg
                  className={`size-4 text-muted-foreground transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <>
                  {/* Backdrop for closing menu */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />

                  <div
                    id={menuId}
                    role="menu"
                    aria-labelledby={buttonId}
                    className="absolute right-0 mt-2 w-56 z-50 rounded-md border border-border bg-popover shadow-lg"
                  >
                    <div className="p-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.email || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">ID: {user.id.slice(0, 8)}...</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <a
                        href="/generate"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        role="menuitem"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generuj fiszki
                      </a>

                      <a
                        href="/flashcards"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        role="menuitem"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        Moje fiszki
                      </a>

                      <a
                        href="/session"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        role="menuitem"
                      >
                        <svg
                          className="size-4"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1.2a1 1 0 0 0 1 1h.3a1 1 0 0 0 .8-1.6L12.9 4a1 1 0 0 0-1.8 0L9.9 6.1A1 1 0 0 0 10.7 7h.3a1 1 0 0 0 1-1V4.8a2.5 2.5 0 0 1-2.5-2.5" />
                          <path d="M14.5 2a2.5 2.5 0 0 0-2.5 2.5v1.2a1 1 0 0 1-1 1h-.3a1 1 0 0 1-.8-1.6L11.1 4a1 1 0 0 1 1.8 0l1.2 1.1a1 1 0 0 1-.8 1.6h-.3a1 1 0 0 1-1-1V4.8a2.5 2.5 0 0 0 2.5-2.5" />
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        </svg>
                        Sesja nauki
                      </a>

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        role="menuitem"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Anonymous state */
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/login">Zaloguj się</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth/register">Rejestracja</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
