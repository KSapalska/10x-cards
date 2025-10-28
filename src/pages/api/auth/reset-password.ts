import type { APIRoute } from "astro";
import { resetPasswordSchema } from "../../../lib/validation";
import { AuthService } from "../../../lib/auth.service";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * Resets user password using session from email link
 *
 * Note: Supabase automatically sets the session when user clicks the reset link from email.
 * The token from URL is handled by Supabase client automatically via middleware.
 *
 * Request body:
 * {
 *   password: string,
 *   confirmPassword: string
 * }
 *
 * Response (200 OK):
 * {
 *   success: true
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string,
 *   details?: array
 * }
 *
 * Response (401 Unauthorized):
 * {
 *   error: string
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Reset password - session is already set by Supabase from email link
    const authService = new AuthService(locals.supabase);
    const result = await authService.resetPassword(password);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error || "Token resetowania jest nieprawidłowy lub wygasł",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reset password endpoint error:", error);

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
