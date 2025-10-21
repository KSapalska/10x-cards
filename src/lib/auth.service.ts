import type { SupabaseClient } from "../db/supabase.client";
import type { Session, User, AuthError } from "@supabase/supabase-js";

// ------------------------------------------------------------------------------------------------
// Authentication Service Response Types
// ------------------------------------------------------------------------------------------------

export interface AuthResponse {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
}

export interface AuthResult {
  success: boolean;
  session?: Session;
  user?: User;
  error?: string;
}

// ------------------------------------------------------------------------------------------------
// Authentication Service
// Handles all Supabase Auth operations with proper error handling
// ------------------------------------------------------------------------------------------------

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Register a new user with email and password
   * Note: Supabase sends a confirmation email by default
   * @param email - User email (normalized to lowercase)
   * @param password - User password (must meet strength requirements)
   * @returns AuthResult with session data or error
   */
  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Log detailed error for debugging
        console.error("Supabase registration error:", {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });

        // Handle specific error cases
        if (error.message.includes("already registered")) {
          return {
            success: false,
            error: "Konto z tym adresem email już istnieje",
          };
        }

        // Return generic error message for security
        return {
          success: false,
          error: "Błąd podczas rejestracji",
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Błąd podczas rejestracji",
        };
      }

      // Note: data.session may be null if email confirmation is required
      // In that case, user needs to confirm email before logging in
      return {
        success: true,
        session: data.session ?? undefined,
        user: data.user,
      };
    } catch (err) {
      console.error("Registration error:", err);
      return {
        success: false,
        error: "Błąd serwera – spróbuj ponownie",
      };
    }
  }

  /**
   * Authenticate user with email and password
   * @param email - User email (normalized to lowercase)
   * @param password - User password
   * @returns AuthResult with session data or error
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Log detailed error for debugging
        console.error("Supabase auth error:", {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });
        // Return generic error message for security
        return {
          success: false,
          error: "Nieprawidłowe dane logowania",
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: "Nieprawidłowe dane logowania",
        };
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (err) {
      console.error("Login error:", err);
      return {
        success: false,
        error: "Błąd serwera – spróbuj ponownie",
      };
    }
  }

  /**
   * Sign out the current user
   * @returns AuthResult indicating success or failure
   */
  async logout(): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        return {
          success: false,
          error: "Błąd podczas wylogowania",
        };
      }

      return {
        success: true,
      };
    } catch (err) {
      console.error("Logout error:", err);
      return {
        success: false,
        error: "Błąd serwera – spróbuj ponownie",
      };
    }
  }

  /**
   * Get current session from Supabase
   * @returns Session or null
   */
  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      return session;
    } catch (err) {
      console.error("Get session error:", err);
      return null;
    }
  }

  /**
   * Get current user from Supabase
   * @returns User or null
   */
  async getUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      return user;
    } catch (err) {
      console.error("Get user error:", err);
      return null;
    }
  }

  /**
   * Refresh the current session
   * Used by middleware for smart refresh strategy
   * @returns AuthResult with new session or error
   */
  async refreshSession(): Promise<AuthResult> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error("Refresh session error:", error);
        return {
          success: false,
          error: "Sesja wygasła. Zaloguj się ponownie.",
        };
      }

      if (!session) {
        return {
          success: false,
          error: "Nie udało się odświeżyć sesji",
        };
      }

      return {
        success: true,
        session,
        user: session.user,
      };
    } catch (err) {
      console.error("Refresh session error:", err);
      return {
        success: false,
        error: "Błąd serwera – spróbuj ponownie",
      };
    }
  }

  /**
   * Check if session is about to expire (within threshold)
   * @param session - Current session
   * @param thresholdSeconds - Seconds before expiry to trigger refresh (default: 300 = 5 minutes)
   * @returns true if session should be refreshed
   */
  shouldRefreshSession(session: Session | null, thresholdSeconds = 300): boolean {
    if (!session || !session.expires_at) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const timeUntilExpiry = expiresAt - now;

    return timeUntilExpiry < thresholdSeconds;
  }

  /**
   * Request password reset email
   * Sends an email with a reset link to the user
   * @param email - User email
   * @returns AuthResult indicating success or failure
   */
  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321"}/auth/reset-password`,
      });

      if (error) {
        console.error("Forgot password error:", error);
        // For security, always return success even if email doesn't exist
        // This prevents email enumeration attacks
      }

      // Always return success for security
      return {
        success: true,
      };
    } catch (err) {
      console.error("Forgot password error:", err);
      // Still return success for security
      return {
        success: true,
      };
    }
  }

  /**
   * Reset password using the current authenticated session
   * Note: Supabase automatically sets the session when user clicks reset link from email
   * The token from URL is handled by Supabase client automatically
   * @param newPassword - New password
   * @returns AuthResult indicating success or failure
   */
  async resetPassword(newPassword: string): Promise<AuthResult> {
    try {
      // Check if user has an active session (from password reset email link)
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Session error:", sessionError);
        return {
          success: false,
          error: "Token resetowania jest nieprawidłowy lub wygasł",
        };
      }

      // Update the password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return {
          success: false,
          error: "Błąd podczas zmiany hasła",
        };
      }

      return {
        success: true,
      };
    } catch (err) {
      console.error("Reset password error:", err);
      return {
        success: false,
        error: "Błąd serwera – spróbuj ponownie",
      };
    }
  }
}
