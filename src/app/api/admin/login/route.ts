import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createAdminToken,
  attachAdminCookie,
  getClientIp,
  checkRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  DEFAULT_ADMIN_USERNAME,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateStatus = checkRateLimit(ip);

    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Account temporarily locked for ${rateStatus.remainingSeconds || 900} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { identifier, username, email, password } = body;
    const loginId = (identifier || username || email || '').trim();

    if (!loginId) {
      return NextResponse.json(
        { success: false, error: 'Please enter your admin username or email.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your admin password.' },
        { status: 400 }
      );
    }

    const result = await verifyAdminCredentials(loginId, password);

    if (!result.success || !result.admin) {
      const failStatus = recordFailedLogin(ip);
      const remainingMsg = failStatus.locked
        ? 'Maximum attempts reached. Account locked for 15 minutes.'
        : 'Incorrect username or password.';
      return NextResponse.json({ success: false, error: remainingMsg }, { status: 401 });
    }

    resetLoginAttempts(ip);
    const token = createAdminToken(result.admin.passwordVersion || 1);
    const res = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      admin: {
        username: result.admin.username,
        email: result.admin.email,
      },
    });
    attachAdminCookie(res, token);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login error';
    console.error('[API Admin Login Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
