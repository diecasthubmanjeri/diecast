import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let latencyMs = 0;

  try {
    const conn = await connectDB();
    if (conn && mongoose.connection.db) {
      // Ping MongoDB Atlas to keep the connection pool warm and prevent idle sleep
      await mongoose.connection.db.command({ ping: 1 });
      dbStatus = 'connected';
    } else {
      dbStatus = 'fallback';
    }
  } catch (err: unknown) {
    dbStatus = 'error';
    console.error('[Keep-Alive Health Error]:', err);
  }

  latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: 'awake',
      service: 'Diecast Hub Application Server',
      database: dbStatus,
      latencyMs,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
