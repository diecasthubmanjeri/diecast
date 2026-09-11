import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/adminAuth';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearAdminCookie(res);
  return res;
}
