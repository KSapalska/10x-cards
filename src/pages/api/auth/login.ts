import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validation";
import { AuthService } from "../../../lib/auth.service";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   rememberMe?: boolean
 * }
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   user: { id: string, email: string }
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
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password, rememberMe } = validationResult.data;

    // Authenticate user
    const authService = new AuthService(locals.supabase);
    const result = await authService.login(email, password);

    if (!result.success || !result.session) {
      return new Response(
        JSON.stringify({
          error: result.error || "Nieprawidłowe dane logowania",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set secure session cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined; // 30 days or session

    cookies.set("sb-access-token", result.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge,
    });

    cookies.set("sb-refresh-token", result.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge,
    });

    // Return success with user data (no sensitive info)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: result.user!.id,
          email: result.user!.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login endpoint error:", error);

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

