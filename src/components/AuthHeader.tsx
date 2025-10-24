import { useState, useCallback, useId } from "react";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { LogOutIcon } from "./icons/HeaderIcons";

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
    <>
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
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      role="menuitem"
                    >
                      <LogOutIcon />
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
    </>
  );
}
