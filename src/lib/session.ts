import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'diecast_session_id';

export function getOrCreateSessionId(req: NextRequest): { sessionId: string; isNew: boolean } {
  const cookieVal = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieVal && cookieVal.trim().length >= 10) {
    return { sessionId: cookieVal.trim(), isNew: false };
  }
  const newSessionId = crypto.randomUUID();
  return { sessionId: newSessionId, isNew: true };
}

export function attachSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });
}
