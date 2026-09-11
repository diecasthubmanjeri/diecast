import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZAp3OiWkGlLZH';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'o1V3xrzMSjn3rQ8BqttW73F7';

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
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'o1V3xrzMSjn3rQ8BqttW73F7';
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('[Razorpay Signature Verification Error]:', err);
    return false;
  }
}
