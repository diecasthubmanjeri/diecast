import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { AdminModel } from '@/models/Admin';
import { getFallbackAdmin, saveFallbackAdmin } from '@/lib/fallbackStorage';

export const ADMIN_COOKIE_NAME = 'diecast_admin_session';

export const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'diecasthubmanjeri';
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'diecasthubmanjeri@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'diecast123';

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'diecasthub_admin_super_secure_key_2026_x89f_manjeri';

// In-memory rate limiting map for login attempts: ip -> { attempts, lockedUntil }
const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

// In-memory rate limiting for OTP dispatch: ip_email -> { count, windowStart, lastSentAt }
const otpRequests = new Map<string, { count: number; windowStart: number; lastSentAt: number }>();

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function checkRateLimit(ip: string): { allowed: boolean; remainingSeconds?: number } {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): { locked: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
    loginAttempts.set(ip, record);
    return { locked: true, remainingSeconds: 900 };
  }

  loginAttempts.set(ip, record);
  return { locked: false };
}

export function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// PBKDF2 Password Hashing with 100,000 iterations & unique salt
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Cryptographic HMAC-SHA256 hash for OTP pins
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(otp.trim()).digest('hex');
}

export interface AdminRecordData {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordVersion: number;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts?: number;
  otpLastSentAt?: Date;
}

export async function getOrInitAdminRecord(): Promise<AdminRecordData> {
  const db = await connectDB();
  if (db) {
    try {
      let admin = await AdminModel.findOne({ username: DEFAULT_ADMIN_USERNAME });
      if (!admin) {
        admin = await AdminModel.findOne({ email: DEFAULT_ADMIN_EMAIL });
      }

      if (admin) {
        return {
          username: admin.username,
          email: admin.email,
          passwordHash: admin.passwordHash,
          salt: admin.salt,
          passwordVersion: admin.passwordVersion || 1,
          otpHash: admin.otpHash,
          otpExpiresAt: admin.otpExpiresAt,
          otpAttempts: admin.otpAttempts,
          otpLastSentAt: admin.otpLastSentAt,
        };
      }

      // First run: Seed default admin in MongoDB
      const salt = generateSalt();
      const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD, salt);
      const newAdmin = await AdminModel.create({
        username: DEFAULT_ADMIN_USERNAME,
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        salt,
        passwordVersion: 1,
      });

      return {
        username: newAdmin.username,
        email: newAdmin.email,
        passwordHash: newAdmin.passwordHash,
        salt: newAdmin.salt,
        passwordVersion: newAdmin.passwordVersion,
      };
    } catch (err) {
      console.error('[Admin DB Lookup Error]:', err);
    }
  }

  // Fallback persistent storage mode
  let fbAdmin = getFallbackAdmin();
  if (!fbAdmin || !fbAdmin.passwordHash || !fbAdmin.salt) {
    const salt = generateSalt();
    const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD, salt);
    fbAdmin = saveFallbackAdmin({
      username: DEFAULT_ADMIN_USERNAME,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      salt,
      passwordVersion: 1,
    });
  }

  return {
    username: fbAdmin.username,
    email: fbAdmin.email,
    passwordHash: fbAdmin.passwordHash,
    salt: fbAdmin.salt,
    passwordVersion: fbAdmin.passwordVersion || 1,
    otpHash: fbAdmin.otpHash,
    otpExpiresAt: fbAdmin.otpExpiresAt ? new Date(fbAdmin.otpExpiresAt) : undefined,
    otpAttempts: fbAdmin.otpAttempts || 0,
    otpLastSentAt: fbAdmin.otpLastSentAt ? new Date(fbAdmin.otpLastSentAt) : undefined,
  };
}

export async function verifyAdminCredentials(
  identifier: string,
  passwordAttempt: string
): Promise<{ success: boolean; admin?: AdminRecordData; error?: string }> {
  if (!identifier || !passwordAttempt) {
    return { success: false, error: 'Username/email and password are required.' };
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const admin = await getOrInitAdminRecord();

  const idMatches =
    cleanIdentifier === admin.username.toLowerCase() ||
    cleanIdentifier === admin.email.toLowerCase();

  if (!idMatches) {
    return { success: false, error: 'Invalid admin credentials.' };
  }

  // Constant-time hash verification to defeat timing attacks
  const computedHash = hashPassword(passwordAttempt, admin.salt);
  const compBuf = Buffer.from(computedHash, 'hex');
  const targetBuf = Buffer.from(admin.passwordHash, 'hex');

  if (compBuf.length !== targetBuf.length || !crypto.timingSafeEqual(compBuf, targetBuf)) {
    return { success: false, error: 'Invalid admin credentials.' };
  }

  return { success: true, admin };
}

// Rate-limiting check for OTP requests: 60s cooldown, max 5/hr
export function checkOtpRateLimit(ip: string, email: string): { allowed: boolean; cooldownSeconds?: number; error?: string } {
  const key = `${ip}_${email.toLowerCase()}`;
  const now = Date.now();
  const record = otpRequests.get(key) || { count: 0, windowStart: now, lastSentAt: 0 };

  if (record.lastSentAt && now - record.lastSentAt < 60000) {
    const cooldownSeconds = Math.ceil((60000 - (now - record.lastSentAt)) / 1000);
    return {
      allowed: false,
      cooldownSeconds,
      error: `Please wait ${cooldownSeconds}s before requesting another PIN.`,
    };
  }

  if (now - record.windowStart > 3600000) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= 5) {
    return {
      allowed: false,
      error: 'Maximum PIN requests reached for this hour. Please try again later.',
    };
  }

  return { allowed: true };
}

export function recordOtpSent(ip: string, email: string) {
  const key = `${ip}_${email.toLowerCase()}`;
  const now = Date.now();
  const record = otpRequests.get(key) || { count: 0, windowStart: now, lastSentAt: 0 };
  record.count += 1;
  record.lastSentAt = now;
  otpRequests.set(key, record);
}

// Generate a cryptographically secure 6-digit PIN and save its HMAC hash
export async function generateAndSaveAdminOtp(): Promise<{ otp: string; expiresAt: Date }> {
  const pinNum = crypto.randomInt(100000, 1000000);
  const otp = String(pinNum);
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute validity
  const now = new Date();

  const db = await connectDB();
  if (db) {
    try {
      await AdminModel.findOneAndUpdate(
        { username: DEFAULT_ADMIN_USERNAME },
        {
          $set: {
            otpHash,
            otpExpiresAt: expiresAt,
            otpAttempts: 0,
            otpLastSentAt: now,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[Admin DB save OTP error]:', err);
    }
  }

  saveFallbackAdmin({
    otpHash,
    otpExpiresAt: expiresAt.toISOString(),
    otpAttempts: 0,
    otpLastSentAt: now.toISOString(),
  });

  return { otp, expiresAt };
}

async function clearAdminOtp() {
  const db = await connectDB();
  if (db) {
    try {
      await AdminModel.findOneAndUpdate(
        { username: DEFAULT_ADMIN_USERNAME },
        {
          $unset: { otpHash: 1, otpExpiresAt: 1 },
          $set: { otpAttempts: 0 },
        }
      );
    } catch (err) {
      console.error('[Clear OTP DB error]:', err);
    }
  }

  saveFallbackAdmin({
    otpHash: undefined,
    otpExpiresAt: undefined,
    otpAttempts: 0,
  });
}

async function incrementAdminOtpAttempts(attempts: number) {
  const db = await connectDB();
  if (db) {
    try {
      await AdminModel.findOneAndUpdate(
        { username: DEFAULT_ADMIN_USERNAME },
        { $set: { otpAttempts: attempts } }
      );
    } catch (err) {
      console.error('[Increment OTP DB error]:', err);
    }
  }

  saveFallbackAdmin({ otpAttempts: attempts });
}

// Verify 6-digit OTP and reset password atomically
export async function verifyAndResetPassword(
  enteredOtp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!enteredOtp || typeof enteredOtp !== 'string' || enteredOtp.trim().length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit security PIN.' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const admin = await getOrInitAdminRecord();

  if (!admin.otpHash || !admin.otpExpiresAt) {
    return { success: false, error: 'No active PIN found. Please request a new verification code.' };
  }

  if (Date.now() > new Date(admin.otpExpiresAt).getTime()) {
    await clearAdminOtp();
    return { success: false, error: 'Security PIN has expired. Please request a new code.' };
  }

  const currentAttempts = (admin.otpAttempts || 0) + 1;
  if (currentAttempts > 3) {
    await clearAdminOtp();
    return { success: false, error: 'Too many incorrect attempts. PIN invalidated for your protection.' };
  }

  // Constant-time OTP comparison
  const enteredHash = hashOtp(enteredOtp);
  const enteredBuf = Buffer.from(enteredHash, 'hex');
  const storedBuf = Buffer.from(admin.otpHash, 'hex');

  const matches = enteredBuf.length === storedBuf.length && crypto.timingSafeEqual(enteredBuf, storedBuf);

  if (!matches) {
    await incrementAdminOtpAttempts(currentAttempts);
    const remaining = 3 - currentAttempts;
    const msg =
      remaining > 0
        ? `Incorrect PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
        : 'Too many incorrect attempts. Security PIN invalidated.';
    if (remaining <= 0) {
      await clearAdminOtp();
    }
    return { success: false, error: msg };
  }

  // PIN verified! Atomically update password and bump version
  const newSalt = generateSalt();
  const newPasswordHash = hashPassword(newPassword, newSalt);
  const newPasswordVersion = (admin.passwordVersion || 1) + 1;

  const db = await connectDB();
  if (db) {
    try {
      await AdminModel.findOneAndUpdate(
        { username: DEFAULT_ADMIN_USERNAME },
        {
          $set: {
            passwordHash: newPasswordHash,
            salt: newSalt,
            passwordVersion: newPasswordVersion,
            otpHash: null,
            otpExpiresAt: null,
            otpAttempts: 0,
          },
        }
      );
    } catch (err) {
      console.error('[DB Reset Password Error]:', err);
    }
  }

  saveFallbackAdmin({
    passwordHash: newPasswordHash,
    salt: newSalt,
    passwordVersion: newPasswordVersion,
    otpHash: undefined,
    otpExpiresAt: undefined,
    otpAttempts: 0,
  });

  return { success: true };
}

// Generate HMAC signed session token
export function createAdminToken(passwordVersion: number = 1): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `admin:${passwordVersion}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

// Verify token authenticity, expiry, and structure
export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const expectedHmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');

  const signatureBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedHmac, 'hex');
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return false;
  }

  const payloadParts = payload.split(':');
  if (payloadParts.length === 2) {
    // Legacy payload admin:expiresAt
    const [role, expiresAtStr] = payloadParts;
    if (role !== 'admin') return false;
    const expiresAt = Number(expiresAtStr);
    return !isNaN(expiresAt) && Date.now() <= expiresAt;
  }

  const [role, , expiresAtStr] = payloadParts;
  if (role !== 'admin') return false;

  const expiresAt = Number(expiresAtStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

export function checkAdminAuth(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value || req.headers.get('x-admin-token');
  return verifyAdminToken(token);
}

export function attachAdminCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
