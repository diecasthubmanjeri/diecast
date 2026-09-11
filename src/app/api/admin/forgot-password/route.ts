import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  checkRateLimit,
  checkOtpRateLimit,
  recordOtpSent,
  generateAndSaveAdminOtp,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_USERNAME,
} from '@/lib/adminAuth';
import { sendAdminOtpEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP brute force lockout check
    const rateStatus = checkRateLimit(ip);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Temporarily locked for ${rateStatus.remainingSeconds || 900} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, identifier } = body;
    const requested = (email || identifier || '').trim().toLowerCase();

    // 2. Strict Recipient & Target Verification
    // Prevents attackers from supplying an arbitrary email to intercept admin reset codes
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
    const adminUsername = (process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();

    const isAuthorizedTarget =
      !requested ||
      requested === adminEmail ||
      requested === adminUsername ||
      requested === 'diecasthubmanjeri@gmail.com' ||
      requested === 'diecasthubmanjeri';

    if (!isAuthorizedTarget) {
      return NextResponse.json(
        {
          success: false,
          error: `Security alert: Verification codes can only be dispatched to the registered store owner email (${DEFAULT_ADMIN_EMAIL}).`,
        },
        { status: 403 }
      );
    }

    // 3. Rate limiting & 60-second Cooldown check
    const otpLimit = checkOtpRateLimit(ip, DEFAULT_ADMIN_EMAIL);
    if (!otpLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: otpLimit.error || 'Please wait before requesting a new verification code.',
          cooldownSeconds: otpLimit.cooldownSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Generate cryptographically random 6-digit PIN & save HMAC hash
    const { otp, expiresAt } = await generateAndSaveAdminOtp();
    recordOtpSent(ip, DEFAULT_ADMIN_EMAIL);

    // 5. Dispatch email via nodemailer / SMTP
    const mailResult = await sendAdminOtpEmail(DEFAULT_ADMIN_EMAIL, otp);

    if (!mailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: mailResult.error || 'Failed to dispatch security code to email. Please check server logs.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit security PIN has been dispatched to ${DEFAULT_ADMIN_EMAIL}.`,
      expiresAt: expiresAt.toISOString(),
      email: DEFAULT_ADMIN_EMAIL,
      simulated: mailResult.simulated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Forgot password error';
    console.error('[API Forgot Password Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to dispatch security code.' }, { status: 500 });
  }
}
