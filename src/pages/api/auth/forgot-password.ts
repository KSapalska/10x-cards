import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "../../../lib/validation";
import { AuthService } from "../../../lib/auth.service";

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email to the user
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   message: string
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string,
 *   details?: array
 * }
 *
 * Note: For security, this endpoint always returns success even if the email doesn't exist.
 * This prevents email enumeration attacks.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Request password reset
    const authService = new AuthService(locals.supabase);
    await authService.forgotPassword(email);

    // Always return success for security (prevents email enumeration)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Forgot password endpoint error:", error);

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

