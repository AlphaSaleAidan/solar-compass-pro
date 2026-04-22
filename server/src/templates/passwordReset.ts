/**
 * ASP Branded Password Reset Email Template
 * 
 * Generates a styled HTML email for password recovery that matches
 * the Alpha Sale Pro dark theme design language.
 */

export function passwordResetEmail(resetUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — Alpha Sale Pro</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0c14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0c14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Logo & Brand -->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#00d4c8,#00b4aa);width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:22px;color:#0a0c14;font-weight:900;">⚡</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:900;letter-spacing:2px;color:#ffffff;">ALPHA SALE PRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#11141e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 40px;">
              
              <!-- Heading -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">Password Reset Request</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:15px;color:#8b95a8;line-height:1.6;">${greeting}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#8b95a8;line-height:1.6;">
                      We received a request to reset your Alpha Sale Pro password. Click the button below to set a new one. This link expires in <strong style="color:#c8cdd6;">60 minutes</strong>.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background:linear-gradient(135deg,#00d4c8,#00b4aa);text-align:center;">
                          <a href="${resetUrl}" target="_blank"
                            style="display:inline-block;padding:16px 48px;font-size:14px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#0a0c14;text-decoration:none;border-radius:8px;">
                            Reset Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- Security Note -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:12px;color:#555d6e;line-height:1.6;">
                      🔒 If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.
                    </p>
                  </td>
                </tr>

                <!-- Fallback URL -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#3d4454;line-height:1.6;word-break:break-all;">
                      Can't click the button? Copy and paste this URL into your browser:<br/>
                      <a href="${resetUrl}" style="color:#00d4c8;text-decoration:none;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:11px;color:#3d4454;line-height:1.6;">
                © ${new Date().getFullYear()} Alpha Sale Pro — Solar Sales Infrastructure<br/>
                <a href="https://alphasalepro.com" style="color:#555d6e;text-decoration:none;">alphasalepro.com</a>
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

/**
 * Password Successfully Changed Confirmation Email
 */
export function passwordChangedEmail(userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Updated — Alpha Sale Pro</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0c14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0c14;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#00d4c8,#00b4aa);width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:22px;color:#0a0c14;font-weight:900;">⚡</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:900;letter-spacing:2px;color:#ffffff;">ALPHA SALE PRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#11141e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;">✅ Password Updated</h1>
              <p style="margin:0 0 8px;font-size:15px;color:#8b95a8;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#8b95a8;line-height:1.6;">
                Your Alpha Sale Pro password has been successfully changed. You can now log in with your new credentials.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#00d4c8,#00b4aa);text-align:center;">
                    <a href="https://alphasalepro.com/login" target="_blank"
                      style="display:inline-block;padding:14px 40px;font-size:14px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#0a0c14;text-decoration:none;border-radius:8px;">
                      Go to Login →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="height:1px;background:rgba(255,255,255,0.06);margin:32px 0 16px;"></div>
              <p style="margin:0;font-size:12px;color:#555d6e;line-height:1.6;">
                🔒 If you didn't make this change, please contact your admin immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:11px;color:#3d4454;">
                © ${new Date().getFullYear()} Alpha Sale Pro — Solar Sales Infrastructure
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
