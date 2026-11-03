import { randomInt } from 'crypto';

export function generateSecureOtp(length = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
}

export function currentTimestamp(): number {
  return Math.floor((Date.now() + 5 * 60 * 1000) / 1000);
}