import nodemailer from 'nodemailer';

interface SendOtpResult {
  success: boolean;
  simulated?: boolean;
  error?: string;
}

export async function sendAdminOtpEmail(targetEmail: string, otp: string): Promise<SendOtpResult> {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const emailPass = rawPass.trim().replace(/\s+/g, '');
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diecast Hub Security Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #334155;">
                    <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); font-size: 24px; color: #ffffff;">
                      🛡️
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 4px; letter-spacing: -0.5px;">
                      DIECAST HUB
                    </h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 0; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                      Admin Security Portal
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 12px;">
                      Password Reset Verification Code
                    </p>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                      A request was received to reset the administrator password for <strong style="color: #38bdf8;">${targetEmail}</strong>. Use the 6-digit security code below to complete the verification.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #0f172a; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #60a5fa; letter-spacing: 8px; margin-bottom: 6px;">
                        ${otp}
                      </div>
                      <div style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⏱️ Expires in 10 minutes
                      </div>
                    </div>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
                      ⚠️ <strong>Security Notice:</strong> Do not share this code with anyone. Diecast Hub administrators will never ask for your PIN.
                    </p>
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                      If you did not request this password reset, you can safely ignore this email or check your server security logs.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #090d16; padding: 20px 32px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="color: #64748b; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} Diecast Hub. All rights reserved. Backend-protected authentication system.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!emailUser || !emailPass) {
    // If SMTP credentials are not configured yet, securely log the OTP to server console
    console.warn('\n=============================================================');
    console.warn('[DIECAST HUB ADMIN SECURITY] SMTP credentials not set in .env.local');
    console.warn(`[OTP DISPATCH] 6-digit PIN for ${targetEmail}: >>> ${otp} <<<`);
    console.warn('Set EMAIL_USER and EMAIL_PASS in .env.local to enable live delivery.');
    console.warn('=============================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const isGmail = smtpHost.toLowerCase().includes('gmail') || emailUser.toLowerCase().endsWith('@gmail.com');
    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          }
        : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          }
    );

    const info = await transporter.sendMail({
      from: `"Diecast Hub Security" <${emailUser}>`,
      to: targetEmail,
      subject: `[Diecast Hub] Admin Verification Code: ${otp}`,
      text: `Your Diecast Hub admin password reset code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[Admin Mail] Security PIN successfully sent to ${targetEmail} (ID: ${info.messageId})`);
    return { success: true, simulated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown mail transport error';
    console.error('[Admin Mail Send Error]:', message);
    return { success: false, error: message };
  }
}
