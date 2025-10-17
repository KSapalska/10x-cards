import { useState, useCallback, useId, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";

interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => Promise<void>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

  const emailId = useId();

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

  const handleEmailBlur = useCallback(() => {
    const emailError = validateEmail(email);
    setFieldErrors({ email: emailError });
  }, [email]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      // Walidacja
      const emailError = validateEmail(email);

      if (emailError) {
        setFieldErrors({ email: emailError });
        return;
      }

      setFieldErrors({});
      setIsLoading(true);

      try {
        if (onSubmit) {
          await onSubmit(email.trim().toLowerCase());
        } else {
          // Fallback - native form submission do /api/auth/forgot-password
          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Błąd podczas wysyłania linku");
          }
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd serwera – spróbuj ponownie");
      } finally {
        setIsLoading(false);
      }
    },
    [email, onSubmit]
  );

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę pocztową</CardTitle>
          <CardDescription>
            Link do resetowania hasła został wysłany na adres{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              Link będzie ważny przez <strong>1 godzinę</strong>. Jeśli nie otrzymasz wiadomości w ciągu kilku
              minut, sprawdź folder spam.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => setSuccess(false)}>
            Wyślij ponownie
          </Button>

          <a
            href="/auth/login"
            className="text-center text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Powrót do logowania
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zapomniałeś hasła?</CardTitle>
        <CardDescription>Podaj swój adres email, a wyślemy Ci link do zresetowania hasła</CardDescription>
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
              autoFocus
            />
            {fieldErrors.email && (
              <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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

