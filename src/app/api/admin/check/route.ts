import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const isAuth = checkAdminAuth(req);
  return NextResponse.json({ success: true, authenticated: isAuth });
}
