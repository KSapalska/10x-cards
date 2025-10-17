import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import { AuthService } from "../lib/auth.service";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/generate"];

// Public routes (anyone can access)
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

// Auth routes (should redirect logged-in users)
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

/**
 * Middleware for handling authentication and session management
 * Features:
 * - SSR session management with secure cookies
 * - Smart refresh strategy (refreshes tokens within 5 minutes of expiry)
 * - Route protection (redirects unauthenticated users from protected routes)
 * - Auth route handling (redirects authenticated users from login/register pages)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get access and refresh tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // Create a Supabase client for this request
  // If we have tokens, set them in the client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We handle session persistence via cookies
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  // If we have tokens, set the session
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Add supabase client to context
  context.locals.supabase = supabase;

  // Get current session
  const authService = new AuthService(supabase);
  const session = await authService.getSession();
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  // Smart refresh: Check if session is about to expire (within 5 minutes)
  if (session && authService.shouldRefreshSession(session, 300)) {
    console.log("Session expiring soon, refreshing...");
    const refreshResult = await authService.refreshSession();

    if (refreshResult.success && refreshResult.session) {
      // Update cookies with new tokens
      // Keep same expiry as original cookie (30 days if rememberMe was set, otherwise session)
      const cookieOptions = {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict" as const,
      };

      context.cookies.set("sb-access-token", refreshResult.session.access_token, cookieOptions);
      context.cookies.set("sb-refresh-token", refreshResult.session.refresh_token, cookieOptions);

      // Update context with new session
      context.locals.session = refreshResult.session;
      context.locals.user = refreshResult.user ?? null;
    } else {
      // Refresh failed, clear session
      console.error("Session refresh failed:", refreshResult.error);
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
      context.locals.session = null;
      context.locals.user = null;
    }
  }

  const pathname = context.url.pathname;

  // Check if user is trying to access a protected route without authentication
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!context.locals.session) {
      // Redirect to login with returnTo parameter
      const returnTo = encodeURIComponent(pathname + context.url.search);
      return context.redirect(`/auth/login?returnTo=${returnTo}`);
    }
  }

  // Check if authenticated user is trying to access auth routes
  if (AUTH_ROUTES.some((route) => pathname === route)) {
    if (context.locals.session) {
      // Check for returnTo parameter
      const returnTo = context.url.searchParams.get("returnTo");
      if (returnTo) {
        return context.redirect(returnTo);
      }
      // Default redirect to generate page
      return context.redirect("/generate");
    }
  }

  return next();
});
