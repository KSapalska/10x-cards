import { useState, useCallback, useId, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";

interface LoginFormProps {
  onSubmit?: (email: string, password: string, rememberMe: boolean) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const emailId = useId();
  const passwordId = useId();
  const rememberMeId = useId();

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Adres email jest wymagany";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Nieprawidłowy format adresu email";
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return "Hasło jest wymagane";
    }
    if (value.length < 6) {
      return "Hasło musi zawierać co najmniej 6 znaków";
    }
    return undefined;
  };

  const handleEmailBlur = useCallback(() => {
    const emailError = validateEmail(email);
    setFieldErrors((prev) => ({ ...prev, email: emailError }));
  }, [email]);

  const handlePasswordBlur = useCallback(() => {
    const passwordError = validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, password: passwordError }));
  }, [password]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      // Walidacja
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (emailError || passwordError) {
        setFieldErrors({
          email: emailError,
          password: passwordError,
        });
        return;
      }

      setFieldErrors({});
      setIsLoading(true);

      try {
        if (onSubmit) {
          await onSubmit(email.trim().toLowerCase(), password, rememberMe);
        } else {
          // Fallback - native form submission do /api/auth/login
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
              rememberMe,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Nieprawidłowe dane logowania");
          }

          // Redirect po sukcesie
          window.location.href = "/generate";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd serwera – spróbuj ponownie");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, rememberMe, onSubmit]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane logowania</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <ErrorNotification message={error} onDismiss={() => setError(null)} />}

          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>Hasło</Label>
            <Input
              id={passwordId}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
              autoComplete="current-password"
              required
            />
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id={rememberMeId}
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="size-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label htmlFor={rememberMeId} className="cursor-pointer text-sm font-normal">
                Zapamiętaj mnie
              </Label>
            </div>
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Nie pamiętasz hasła?
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <a
              href="/auth/register"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

