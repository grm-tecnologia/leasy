import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { sendWelcomeEmail } from "../email";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Build the Google OAuth authorization URL.
 */
function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ENV.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export function registerOAuthRoutes(app: Express) {
  /**
   * GET /api/auth/google
   * Initiates Google OAuth flow. Frontend redirects here.
   * Query params:
   *   - returnPath (optional): where to redirect after login
   */
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const returnPath = getQueryParam(req, "returnPath") || "/";
    const origin = getQueryParam(req, "origin") || ENV.appUrl;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = Buffer.from(JSON.stringify({ returnPath, origin })).toString("base64url");
    const authUrl = buildGoogleAuthUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });

  /**
   * GET /api/auth/google/callback
   * Google redirects here after user authorizes.
   * Exchanges code for tokens, creates/updates user, sets session cookie.
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const stateParam = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    let returnPath = "/";
    let origin = ENV.appUrl;

    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
        returnPath = stateData.returnPath || "/";
        origin = stateData.origin || ENV.appUrl;
      } catch {
        // Invalid state, use defaults
      }
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    try {
      const googleUser = await sdk.exchangeGoogleCode(code, redirectUri);

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(googleUser.openId);
      const isNewUser = !existingUser;

      // Upsert user in database
      await db.upsertUser({
        openId: googleUser.openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Send welcome email for new users
      if (isNewUser && googleUser.email) {
        sendWelcomeEmail(googleUser.email, googleUser.name || "").catch(err => {
          console.warn("[OAuth] Failed to send welcome email:", err);
        });
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(googleUser.openId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the return path
      res.redirect(302, returnPath === "/" ? "/" : returnPath);
    } catch (error) {
      console.error("[OAuth] Google callback failed:", error);
      res.redirect(302, "/login?error=auth_failed");
    }
  });

  // Legacy route compatibility - redirect old Manus OAuth callback to new flow
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/api/auth/google");
  });
}
