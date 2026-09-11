/**
 * Diecast Hub - 24/7 Keep-Alive & MongoDB Atlas Wakeup Bot
 * Run with: node scripts/keep-alive-bot.js [optional_target_url]
 * Default target: http://localhost:3000/api/keep-alive or your Vercel production URL
 */

const targetUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'https://diecastshub.in';
const keepAliveEndpoint = targetUrl.replace(/\/$/, '') + '/api/keep-alive';
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

console.log('--------------------------------------------------');
console.log('🤖 Diecast Hub Keep-Alive Bot Started');
console.log(`🎯 Target: ${keepAliveEndpoint}`);
console.log(`⏱️ Interval: Every 4 minutes`);
console.log('--------------------------------------------------');

async function ping() {
  const now = new Date().toLocaleTimeString();
  try {
    const res = await fetch(keepAliveEndpoint, {
      headers: { 'User-Agent': 'DiecastHub-KeepAlive-Bot/1.0' },
    });
    const data = await res.json();
    console.log(`[${now}] ✅ Ping OK (${res.status}) - DB: ${data.database} - Latency: ${data.latencyMs}ms`);
  } catch (err) {
    console.warn(`[${now}] ⚠️ Keep-Alive ping error:`, err.message);
  }
}

// Initial ping on start
ping();

// Recurring heartbeat loop
setInterval(ping, PING_INTERVAL_MS);
