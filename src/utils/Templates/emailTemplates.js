// src/utils/emailTemplates.js

export const signupOtpTemplate = (username = null, otp = null) => {
  // Fallbacks
  const safeOtp = otp || "------";
  const greeting = username
    ? `Welcome, <strong>${username}</strong> 👋`
    : "Welcome 👋";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; padding: 20px; text-align: center; color: #333;">
    <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 6px 16px rgba(0,0,0,0.08);">
      
      <h2 style="color: #2d89ef; margin-bottom: 15px;">${greeting}</h2>

      <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 20px;">
        Thank you for signing up! Please use the following OTP to verify your email:
      </p>

      <div style="margin: 25px 0;">
        <h1 style="background: #2d89ef; color: #fff; display: inline-block; padding: 14px 28px; border-radius: 10px; letter-spacing: 5px; font-size: 30px; font-weight: bold;">
          ${safeOtp}
        </h1>
      </div>

      <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
        This OTP will expire in <strong>10 minutes</strong>.
      </p>

      <p style="font-size: 14px; color: #777; margin-top: 20px;">
        If you did not request this, you can safely ignore this email.
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.4;">
        &copy; ${new Date().getFullYear()} MyApp. All rights reserved.<br/>
        This is an automated email, please do not reply.
      </p>
    </div>
  </div>
  `;
};
