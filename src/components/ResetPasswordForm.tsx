import { useState, useCallback, useId, useMemo, useEffect, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";

interface ResetPasswordFormProps {
  token?: string;
  onSubmit?: (token: string, password: string, confirmPassword: string) => Promise<void>;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function ResetPasswordForm({ token: providedToken, onSubmit }: ResetPasswordFormProps) {
  const [token, setToken] = useState(providedToken || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const passwordId = useId();
  const confirmPasswordId = useId();

  useEffect(() => {
    // Pobierz token z URL jeśli nie został przekazany przez props
    if (!providedToken) {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");

      if (!urlToken) {
        setTokenError(true);
      } else {
        setToken(urlToken);
      }
    }
  }, [providedToken]);

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return "Hasło jest wymagane";
    }
    if (value.length < 8) {
      return "Hasło musi zawierać co najmniej 8 znaków";
    }
    if (!/[A-Z]/.test(value)) {
      return "Hasło musi zawierać co najmniej jedną wielką literę";
    }
    if (!/[0-9]/.test(value)) {
      return "Hasło musi zawierać co najmniej jedną cyfrę";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      return "Hasło musi zawierać co najmniej jeden znak specjalny";
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (value !== password) {
      return "Hasła nie są identyczne";
    }
    return undefined;
  };

  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) {
      return { score: 0, label: "", color: "" };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    if (score <= 2) {
      return { score, label: "Słabe", color: "bg-destructive" };
    } else if (score <= 3) {
      return { score, label: "Średnie", color: "bg-chart-4" };
    } else {
      return { score, label: "Silne", color: "bg-chart-2" };
    }
  }, [password]);

  const handlePasswordBlur = useCallback(() => {
    const passwordError = validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, password: passwordError }));
  }, [password]);

  const handleConfirmPasswordBlur = useCallback(() => {
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmPasswordError }));
  }, [confirmPassword, password]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!token) {
        setError("Brak tokenu resetowania hasła");
        return;
      }

      // Walidacja
      const passwordError = validatePassword(password);
      const confirmPasswordError = validateConfirmPassword(confirmPassword);

      if (passwordError || confirmPasswordError) {
        setFieldErrors({
          password: passwordError,
          confirmPassword: confirmPasswordError,
        });
        return;
      }

      setFieldErrors({});
      setIsLoading(true);

      try {
        if (onSubmit) {
          await onSubmit(token, password, confirmPassword);
        } else {
          // Fallback - native form submission do /api/auth/reset-password
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              password,
              confirmPassword,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Błąd podczas resetowania hasła");
          }
        }

        setSuccess(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Błąd serwera – spróbuj ponownie";
        if (errorMessage.includes("token") || errorMessage.includes("wygasł")) {
          setTokenError(true);
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [token, password, confirmPassword, onSubmit]
  );

  if (tokenError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nieprawidłowy lub wygasły link</CardTitle>
          <CardDescription>Link do resetowania hasła jest nieprawidłowy lub wygasł</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p>Token resetowania hasła jest nieprawidłowy lub wygasł. Linki resetowania są ważne przez 1 godzinę.</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="button" variant="outline" className="w-full" onClick={() => (window.location.href = "/auth/forgot-password")}>
            Wyślij nowy link resetujący
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hasło zostało zmienione</CardTitle>
          <CardDescription>Możesz teraz zalogować się nowym hasłem</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-chart-2/10 p-4 text-sm text-chart-2">
            <p>Twoje hasło zostało pomyślnie zmienione. Zaloguj się używając nowego hasła.</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="button" className="w-full" onClick={() => (window.location.href = "/auth/login")}>
            Przejdź do logowania
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <ErrorNotification message={error} onDismiss={() => setError(null)} />}

          <div className="space-y-2">
            <Label htmlFor={passwordId}>Nowe hasło</Label>
            <Input
              id={passwordId}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? `${passwordId}-error` : password ? `${passwordId}-strength` : undefined
              }
              autoComplete="new-password"
              required
              autoFocus
            />
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            )}
            {password && !fieldErrors.password && (
              <div id={`${passwordId}-strength`} className="space-y-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength.score ? passwordStrength.color : "bg-muted"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Siła hasła: {passwordStrength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>Potwierdź nowe hasło</Label>
            <Input
              id={confirmPasswordId}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={handleConfirmPasswordBlur}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p id={`${confirmPasswordId}-error`} className="text-sm text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetowanie..." : "Zresetuj hasło"}
          </Button>

          <a
            href="/auth/login"
            className="text-center text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Powrót do logowania
          </a>
        </CardFooter>
      </form>
    </Card>
  );
}

