import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/auth.service";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 *
 * Response (200 OK):
 * {
 *   success: true
 * }
 *
 * Response (500 Internal Server Error):
 * {
 *   error: string
 * }
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Sign out from Supabase
    const authService = new AuthService(locals.supabase);
    const result = await authService.logout();

    // Clear session cookies regardless of Supabase response
    // This ensures cleanup even if Supabase call fails
    cookies.delete("sb-access-token", {
      path: "/",
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
    });

    if (!result.success) {
      console.error("Logout error:", result.error);
      // Still return success since cookies are cleared
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
    console.error("Logout endpoint error:", error);

    // Even on error, try to clear cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

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

