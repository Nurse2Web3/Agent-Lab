import { Router, type IRouter } from "express";
import { createHmac, randomInt } from "crypto";
import { trialStorage } from "../trialStorage.js";
import { isDisposableEmail } from "../lib/disposableEmailDomains.js";
import { sendVerificationEmail } from "../lib/email.js";
import {
  signupRateLimiter,
  verifyRateLimiter,
  captchaRateLimiter,
  getClientIp,
} from "../middleware/rateLimiter.js";

const router: IRouter = Router();

const CAPTCHA_SECRET = process.env.TRIAL_CAPTCHA_SECRET ?? "agentlab-captcha-secret-change-in-prod";
const CAPTCHA_TTL_MS = 10 * 60 * 1000;

function makeCaptchaToken(answer: number, expiresAt: number): string {
  return createHmac("sha256", CAPTCHA_SECRET)
    .update(`${answer}:${expiresAt}`)
    .digest("hex");
}

router.get("/trial/captcha", captchaRateLimiter, (_req, res) => {
  const a = randomInt(1, 15);
  const b = randomInt(1, 15);
  const answer = a + b;
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;
  const token = makeCaptchaToken(answer, expiresAt);
  res.json({
    question: `What is ${a} + ${b}?`,
    token: `${expiresAt}:${token}`,
  });
});

function verifyCaptcha(token: string, answer: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const expiresAt = parseInt(parts[0], 10);
  const tokenHash = parts[1];
  if (Date.now() > expiresAt) return false;
  const num = parseInt(answer, 10);
  if (isNaN(num)) return false;
  const expected = makeCaptchaToken(num, expiresAt);
  return expected === tokenHash;
}

router.post("/trial/signup", signupRateLimiter, async (req, res) => {
  const { email, captchaToken, captchaAnswer, deviceFingerprint } = req.body as {
    email?: string;
    captchaToken?: string;
    captchaAnswer?: string;
    deviceFingerprint?: string;
  };

  const ip = getClientIp(req);

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  if (!captchaToken || !captchaAnswer) {
    res.status(400).json({ error: "Please complete the CAPTCHA." });
    return;
  }
  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    await trialStorage.log({ action: "suspicious", email, ipAddress: ip, deviceFingerprint, reason: "captcha_failed" });
    res.status(400).json({ error: "Incorrect CAPTCHA answer. Please try again." });
    return;
  }

  if (isDisposableEmail(email)) {
    await trialStorage.log({ action: "blocked_disposable", email, ipAddress: ip, deviceFingerprint, reason: "disposable_email_domain" });
    res.status(400).json({ error: "Please use a permanent email address. Temporary email services are not allowed." });
    return;
  }

  const recentIpSignups = await trialStorage.countRecentSignupsByIp(ip, 60 * 60 * 1000);
  if (recentIpSignups >= 5) {
    await trialStorage.log({ action: "blocked_ip_reuse", email, ipAddress: ip, deviceFingerprint, reason: `ip_rate_limit_${recentIpSignups}` });
    res.status(429).json({ error: "Too many trial signups from this network. Please try again later." });
    return;
  }

  if (deviceFingerprint) {
    const deviceTrialUser = await trialStorage.getByDeviceFingerprint(deviceFingerprint);
    if (deviceTrialUser?.trialUsed) {
      await trialStorage.log({ action: "blocked_device", email, ipAddress: ip, deviceFingerprint, reason: "device_trial_exhausted" });
      res.status(403).json({
        error: "A trial has already been used on this device.",
        upgrade: true,
      });
      return;
    }

    const recentDeviceSignups = await trialStorage.countRecentSignupsByDevice(deviceFingerprint, 24 * 60 * 60 * 1000);
    if (recentDeviceSignups >= 3) {
      await trialStorage.log({ action: "suspicious", email, ipAddress: ip, deviceFingerprint, reason: `device_signup_count_${recentDeviceSignups}` });
      res.status(429).json({ error: "Too many trial attempts from this device. Please wait 24 hours or upgrade." });
      return;
    }
  }

  let trialUser;
  try {
    trialUser = await trialStorage.createTrialUser({ email, deviceFingerprint, ipAddress: ip });
  } catch (err: any) {
    console.error("trial/signup db error:", err.message);
    res.status(500).json({ error: "Failed to create trial account. Please try again." });
    return;
  }

  await trialStorage.log({ action: "signup", email, ipAddress: ip, deviceFingerprint, reason: "new_signup" });

  const baseUrl = (() => {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    return domain ? `https://${domain}` : "http://localhost:3000";
  })();

  const verifyUrl = `${baseUrl}/api/trial/verify/${trialUser.verificationToken}`;

  if (trialUser.emailVerified) {
    res.json({
      success: true,
      alreadyVerified: true,
      trialUserId: trialUser.id,
      comparisonsUsed: trialUser.trialComparisonsUsed,
      message: "This email has already been verified. Your trial is active.",
    });
    return;
  }

  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (err: any) {
    console.error("[TRIAL] Email send failed:", err.message);
  }

  console.log(`\n[TRIAL] Email verification for ${email}:\n  ${verifyUrl}\n`);

  const isDev = process.env.NODE_ENV !== "production";

  res.json({
    success: true,
    alreadyVerified: false,
    trialUserId: trialUser.id,
    message: "Check your email for a verification link.",
    ...(isDev ? { _devVerifyUrl: verifyUrl } : {}),
  });
});

router.get("/trial/verify/:token", verifyRateLimiter, async (req, res) => {
  const token = req.params.token as string;
  const ip = getClientIp(req);

  const baseUrl = (() => {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    return domain ? `https://${domain}` : "http://localhost:3000";
  })();

  const trialUser = await trialStorage.verifyEmail(token);

  if (!trialUser) {
    const existing = await trialStorage.getByToken(token);
    if (existing) {
      res.redirect(`${baseUrl}/playground?trialError=expired`);
    } else {
      res.redirect(`${baseUrl}/playground?trialError=invalid`);
    }
    return;
  }

  await trialStorage.log({ action: "verify", email: trialUser.email, ipAddress: ip, deviceFingerprint: trialUser.deviceFingerprint ?? undefined });

  res.redirect(`${baseUrl}/playground?trialId=${trialUser.id}`);
});

router.get("/trial/status/:userId", async (req, res) => {
  const { userId } = req.params;
  const trialUser = await trialStorage.getById(userId);

  if (!trialUser) {
    res.status(404).json({ error: "Trial account not found." });
    return;
  }

  const TRIAL_LIMIT = 3;

  res.json({
    id: trialUser.id,
    email: trialUser.email,
    emailVerified: trialUser.emailVerified,
    trialUsed: trialUser.trialUsed,
    comparisonsUsed: trialUser.trialComparisonsUsed,
    comparisonsRemaining: Math.max(0, TRIAL_LIMIT - trialUser.trialComparisonsUsed),
    trialLimit: TRIAL_LIMIT,
    exhausted: trialUser.trialComparisonsUsed >= TRIAL_LIMIT,
  });
});

router.get("/trial/admin/logs", async (_req, res) => {
  const logs = await trialStorage.getRecentLogs(200);
  res.json({ logs });
});


export default router;
