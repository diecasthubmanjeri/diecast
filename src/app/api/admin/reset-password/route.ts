import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  checkRateLimit,
  verifyAndResetPassword,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP rate limiting check
    const rateStatus = checkRateLimit(ip);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Account locked for ${rateStatus.remainingSeconds || 900} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { otp, newPassword, confirmPassword } = body;

    // 2. Strict Input Validation
    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit numeric PIN.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    // 3. Cryptographic Verification & Atomic Reset
    const resetResult = await verifyAndResetPassword(cleanOtp, newPassword);

    if (!resetResult.success) {
      return NextResponse.json(
        { success: false, error: resetResult.error || 'Password reset failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now log in with your new password.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset password error';
    console.error('[API Reset Password Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to reset password.' }, { status: 500 });
  }
}
