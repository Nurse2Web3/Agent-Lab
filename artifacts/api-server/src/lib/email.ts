import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("[EMAIL] RESEND_API_KEY not set — emails will not be sent.");
      return null;
    }
    resend = new Resend(key);
  }
  return resend;
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const client = getResend();
  if (!client) return;

  const { error } = await client.emails.send({
    from: "Ai AgentLab <onboarding@resend.dev>",
    to,
    subject: "Activate your Ai AgentLab trial",
    html: buildEmailHtml(verifyUrl),
  });

  if (error) {
    console.error("[EMAIL] Failed to send verification email:", error);
    throw new Error("Failed to send verification email.");
  }

  console.log(`[EMAIL] Verification email sent to ${to}`);
}

function buildEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Activate your Ai AgentLab trial</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#13131a;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Ai AgentLab</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
                Activate your free trial
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                You're one click away from comparing AI models side-by-side. Click the button below to activate your 3 free comparisons.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.1px;">
                      Activate my trial &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                Or paste this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:#7c3aed;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.5;">
                This link expires in 1 hour. If you didn't sign up for Ai AgentLab, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
