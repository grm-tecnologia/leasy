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
   * GET /api/oauth/google
   * Initiates Google OAuth flow. Frontend redirects here.
   * Query params:
   *   - returnPath (optional): where to redirect after login
   */
  app.get("/api/oauth/google", (req: Request, res: Response) => {
    const returnPath = getQueryParam(req, "returnPath") || "/";
    const origin = getQueryParam(req, "origin") || ENV.appUrl;
    const redirectUri = `${origin}/api/oauth/google/callback`;
    const state = Buffer.from(JSON.stringify({ returnPath, origin })).toString("base64url");
    const authUrl = buildGoogleAuthUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });

  /**
   * GET /api/oauth/google/callback
   * Google redirects here after user authorizes.
   * Exchanges code for tokens, creates/updates user, sets session cookie.
   */
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
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

    const redirectUri = `${origin}/api/oauth/google/callback`;

    try {
      const googleUser = await sdk.exchangeGoogleCode(code, redirectUri);

      // Step 1: Check if user already exists by Google openId
      let existingUser = await db.getUserByOpenId(googleUser.openId);
      let isNewUser = !existingUser;

      // Step 2: Migration - if no user found by Google openId, check by email
      // This handles users who previously logged in via Manus OAuth and now
      // use Google OAuth for the first time
      if (!existingUser && googleUser.email) {
        const emailUser = await db.getUserByEmail(googleUser.email);
        if (emailUser) {
          console.log('[OAuth] Migrating user ' + emailUser.email + ' from old openId ' + emailUser.openId + ' to ' + googleUser.openId);
          await db.updateUserOpenId(emailUser.openId, googleUser.openId);
          existingUser = { ...emailUser, openId: googleUser.openId };
          isNewUser = false;
        }
      }

      // Step 3: Upsert user in database
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
    res.redirect(302, "/api/oauth/google");
  });
}
