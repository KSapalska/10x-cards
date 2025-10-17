import { useState, useCallback, useId, useMemo, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";

interface RegisterFormProps {
  onSubmit?: (email: string, password: string, confirmPassword: string) => Promise<void>;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

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

  const handleEmailBlur = useCallback(() => {
    const emailError = validateEmail(email);
    setFieldErrors((prev) => ({ ...prev, email: emailError }));
  }, [email]);

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

      // Walidacja
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      const confirmPasswordError = validateConfirmPassword(confirmPassword);

      if (emailError || passwordError || confirmPasswordError) {
        setFieldErrors({
          email: emailError,
          password: passwordError,
          confirmPassword: confirmPasswordError,
        });
        return;
      }

      setFieldErrors({});
      setIsLoading(true);

      try {
        if (onSubmit) {
          await onSubmit(email.trim().toLowerCase(), password, confirmPassword);
        } else {
          // Fallback - native form submission do /api/auth/register
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
              confirmPassword,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Błąd podczas rejestracji");
          }

          // Redirect po sukcesie (użytkownik jest automatycznie zalogowany)
          window.location.href = "/generate";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd serwera – spróbuj ponownie");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, confirmPassword, onSubmit]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>Zarejestruj się, aby korzystać z aplikacji</CardDescription>
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
              aria-describedby={
                fieldErrors.password ? `${passwordId}-error` : password ? `${passwordId}-strength` : undefined
              }
              autoComplete="new-password"
              required
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
            <Label htmlFor={confirmPasswordId}>Potwierdź hasło</Label>
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
            {isLoading ? "Rejestracja..." : "Zarejestruj się"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <a
              href="/auth/login"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

