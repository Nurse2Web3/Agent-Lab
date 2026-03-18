import { Router, type IRouter } from "express";
import { createHmac, randomInt } from "crypto";
import { trialStorage } from "../trialStorage.js";
import { isDisposableEmail } from "../lib/disposableEmailDomains.js";
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
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!captchaToken || !captchaAnswer) {
    return res.status(400).json({ error: "Please complete the CAPTCHA." });
  }
  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    await trialStorage.log({ action: "suspicious", email, ipAddress: ip, deviceFingerprint, reason: "captcha_failed" });
    return res.status(400).json({ error: "Incorrect CAPTCHA answer. Please try again." });
  }

  if (isDisposableEmail(email)) {
    await trialStorage.log({ action: "blocked_disposable", email, ipAddress: ip, deviceFingerprint, reason: "disposable_email_domain" });
    return res.status(400).json({ error: "Please use a permanent email address. Temporary email services are not allowed." });
  }

  const recentIpSignups = await trialStorage.countRecentSignupsByIp(ip, 60 * 60 * 1000);
  if (recentIpSignups >= 5) {
    await trialStorage.log({ action: "blocked_ip_reuse", email, ipAddress: ip, deviceFingerprint, reason: `ip_rate_limit_${recentIpSignups}` });
    return res.status(429).json({ error: "Too many trial signups from this network. Please try again later." });
  }

  if (deviceFingerprint) {
    const deviceTrialUser = await trialStorage.getByDeviceFingerprint(deviceFingerprint);
    if (deviceTrialUser?.trialUsed) {
      await trialStorage.log({ action: "blocked_device", email, ipAddress: ip, deviceFingerprint, reason: "device_trial_exhausted" });
      return res.status(403).json({
        error: "A trial has already been used on this device.",
        upgrade: true,
      });
    }

    const recentDeviceSignups = await trialStorage.countRecentSignupsByDevice(deviceFingerprint, 24 * 60 * 60 * 1000);
    if (recentDeviceSignups >= 3) {
      await trialStorage.log({ action: "suspicious", email, ipAddress: ip, deviceFingerprint, reason: `device_signup_count_${recentDeviceSignups}` });
      return res.status(429).json({ error: "Too many trial attempts from this device. Please wait 24 hours or upgrade." });
    }
  }

  let trialUser;
  try {
    trialUser = await trialStorage.createTrialUser({ email, deviceFingerprint, ipAddress: ip });
  } catch (err: any) {
    console.error("trial/signup db error:", err.message);
    return res.status(500).json({ error: "Failed to create trial account. Please try again." });
  }

  await trialStorage.log({ action: "signup", email, ipAddress: ip, deviceFingerprint, reason: "new_signup" });

  const baseUrl = (() => {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    return domain ? `https://${domain}` : "http://localhost:3000";
  })();

  const verifyUrl = `${baseUrl}/api/trial/verify/${trialUser.verificationToken}`;

  console.log(`\n[TRIAL] Email verification for ${email}:\n  ${verifyUrl}\n`);

  if (trialUser.emailVerified) {
    return res.json({
      success: true,
      alreadyVerified: true,
      trialUserId: trialUser.id,
      comparisonsUsed: trialUser.trialComparisonsUsed,
      message: "This email has already been verified. Your trial is active.",
    });
  }

  res.json({
    success: true,
    alreadyVerified: false,
    trialUserId: trialUser.id,
    verifyUrl,
    message: "Check your email for a verification link.",
    _devVerifyUrl: verifyUrl,
  });
});

router.get("/trial/verify/:token", verifyRateLimiter, async (req, res) => {
  const { token } = req.params;
  const ip = getClientIp(req);

  const trialUser = await trialStorage.verifyEmail(token);

  if (!trialUser) {
    const stale = await trialStorage.getByToken(token);
    if (stale) {
      return res.status(400).send(verifyPage("Verification Link Expired", "This link has expired. Please sign up again to get a new verification link.", false));
    }
    return res.status(404).send(verifyPage("Invalid Link", "This verification link is invalid or has already been used.", false));
  }

  await trialStorage.log({ action: "verify", email: trialUser.email, ipAddress: ip, deviceFingerprint: trialUser.deviceFingerprint ?? undefined });

  const baseUrl = (() => {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    return domain ? `https://${domain}` : "http://localhost:3000";
  })();

  res.send(verifyPage(
    "Email Verified!",
    `Your trial is now active. You have 3 comparisons to use. <a href="${baseUrl}/playground" style="color:#7c3aed;font-weight:bold;">Go to the playground &rarr;</a>`,
    true
  ));
});

router.get("/trial/status/:userId", async (req, res) => {
  const { userId } = req.params;
  const trialUser = await trialStorage.getById(userId);

  if (!trialUser) {
    return res.status(404).json({ error: "Trial account not found." });
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

function verifyPage(title: string, body: string, success: boolean): string {
  const color = success ? "#7c3aed" : "#dc2626";
  const bg = success ? "#f5f3ff" : "#fef2f2";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — Ai AgentLab</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;}
    .card{background:${bg};color:#1a1a2e;border-radius:16px;padding:48px 40px;max-width:480px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);}
    h1{color:${color};margin:0 0 16px;font-size:28px;}
    p{font-size:16px;line-height:1.6;color:#374151;}
    a{color:${color};text-decoration:none;}
    .icon{font-size:48px;margin-bottom:20px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "❌"}</div>
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

export default router;
