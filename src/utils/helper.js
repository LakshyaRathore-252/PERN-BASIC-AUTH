import crypto from 'crypto';

/**
 * Generate a secure random numeric OTP of given length
 * @param {number} length - Number of digits in OTP
 * @returns {string} OTP as string
 */
export const generateOtp = (length = 6) => {
  if (length <= 0) throw new Error("OTP length must be greater than 0");

  let otp = '';
  for (let i = 0; i < length; i++) {
    // Generate a random integer from 0-9
    const digit = crypto.randomInt(0, 10);
    otp += digit.toString();
  }
  return otp;
};



/**
 * Convert all BigInt values to string recursively
 * Useful for JWT and JSON responses
 */
export function convertBigIntToString(obj) {
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'bigint') return [key, value.toString()];
        else if (typeof value === 'object' && value !== null) return [key, convertBigIntToString(value)];
        else return [key, value];
      })
    );
  }
  return obj;
}


// utility to safely convert BigInt values
export function normalizeUser(user) {
  return JSON.parse(
    JSON.stringify(user, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}