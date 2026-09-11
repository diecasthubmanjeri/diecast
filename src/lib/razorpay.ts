import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TamrhwLSG7gdpa';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '23kvifWPax4eIjNJzGJI9zf6';

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    if (!orderId || !paymentId || !signature) return false;
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '23kvifWPax4eIjNJzGJI9zf6';
    const body = `${orderId.trim()}|${paymentId.trim()}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const signatureBuf = Buffer.from(signature.trim(), 'hex');

    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.error('[Razorpay Signature Verification Error]:', err);
    return false;
  }
}
