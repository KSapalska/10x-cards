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
}

