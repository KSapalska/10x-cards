import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import { AuthService } from "../lib/auth.service";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/generate"];

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
  // Check for tokens in URL params (from password reset email link)
  const urlAccessToken = context.url.searchParams.get("access_token");
  const urlRefreshToken = context.url.searchParams.get("refresh_token");

  // Get access and refresh tokens from cookies or URL
  let accessToken = context.cookies.get("sb-access-token")?.value || urlAccessToken;
  let refreshToken = context.cookies.get("sb-refresh-token")?.value || urlRefreshToken;

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

  // If we have tokens from URL, set the session and store in cookies
  if (urlAccessToken && urlRefreshToken) {
    await supabase.auth.setSession({
      access_token: urlAccessToken,
      refresh_token: urlRefreshToken,
    });

    // Store tokens in cookies for future requests
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict" as const,
      maxAge: 60 * 60, // 1 hour - enough time for password reset
    };

    context.cookies.set("sb-access-token", urlAccessToken, cookieOptions);
    context.cookies.set("sb-refresh-token", urlRefreshToken, cookieOptions);

    // Redirect to clean URL (remove tokens from URL for security)
    const cleanUrl = new URL(context.url);
    cleanUrl.searchParams.delete("access_token");
    cleanUrl.searchParams.delete("refresh_token");
    cleanUrl.searchParams.delete("type"); // Supabase also adds 'type' param

    // Only redirect if URL actually changed
    if (context.url.href !== cleanUrl.href) {
      return context.redirect(cleanUrl.pathname + cleanUrl.search);
    }
  } else if (accessToken && refreshToken) {
    // If we have tokens from cookies, set the session
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
