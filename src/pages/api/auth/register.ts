import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validation";
import { AuthService } from "../../../lib/auth.service";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 *
 * Note: Supabase sends a confirmation email by default.
 * Users must verify their email before they can log in.
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   confirmPassword: string
 * }
 *
 * Response (201 Created):
 * {
 *   success: true,
 *   user: { id: string, email: string },
 *   requiresEmailVerification: boolean,
 *   message: string
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string,
 *   details?: array
 * }
 *
 * Response (409 Conflict):
 * {
 *   error: string
 * }
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Register user
    const authService = new AuthService(locals.supabase);
    const result = await authService.register(email, password);

    if (!result.success || !result.user) {
      // Check if it's a duplicate email error
      if (result.error?.includes("już istnieje")) {
        return new Response(
          JSON.stringify({
            error: result.error,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: result.error || "Błąd podczas rejestracji",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email verification is required
    // If session is null, it means email confirmation is required
    const requiresEmailVerification = !result.session;

    // If we have a session (email confirmation disabled), set cookies
    if (result.session) {
      cookies.set("sb-access-token", result.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      cookies.set("sb-refresh-token", result.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Return success with user data (no sensitive info)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        requiresEmailVerification,
        message: requiresEmailVerification
          ? "Konto zostało utworzone. Sprawdź swoją skrzynkę email i potwierdź adres, aby się zalogować."
          : "Konto zostało utworzone pomyślnie",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Register endpoint error:", error);

    return new Response(
      JSON.stringify({
        error: "Błąd serwera – spróbuj ponownie",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
