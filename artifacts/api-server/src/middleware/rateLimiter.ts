import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  keyFn: (req: Request) => string;
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = opts.keyFn(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (entry.count >= opts.max) {
      res.status(429).json({
        error: opts.message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    entry.count++;
    return next();
  };
}

function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const ips = Array.isArray(xff) ? xff[0] : xff;
    return ips.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export const signupRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  keyFn: getClientIp,
  message: "Too many signup attempts from this IP. Please try again in 24 hours.",
});

export const verifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: getClientIp,
  message: "Too many verification attempts. Please try again later.",
});

export const captchaRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyFn: getClientIp,
  message: "Too many CAPTCHA requests. Please try again later.",
});

export const trialCompareRateLimiter = createRateLimiter({
  windowMs: 20 * 1000,
  max: 1,
  keyFn: (req) => {
    const body = req.body as { trialUserId?: string };
    return `trial-compare:${getClientIp(req)}:${body.trialUserId ?? "unknown"}`;
  },
  message: "Please wait a moment before running another comparison.",
});

export { getClientIp };
