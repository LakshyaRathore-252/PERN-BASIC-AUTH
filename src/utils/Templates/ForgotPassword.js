export const forgotPasswordOtpTemplate = (otp, username = null) => {
  console.log(otp , username)

  // fallback if OTP is not provided
  const safeOtp = otp || "------";
  // greeting message based on username availability
  const greeting = username
    ? `Hello <strong>${username}</strong>,`
    : "Hello,";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; padding: 20px; text-align: center; color: #333;">
    <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 6px 16px rgba(0,0,0,0.08);">
      
      <h2 style="color: #2d89ef; margin-bottom: 15px;">🔑 Password Reset Request</h2>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 15px;">
        ${greeting}
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 20px;">
        We received a request to reset your password. Please use the OTP below:
      </p>

      <div style="margin: 25px 0;">
        <h1 style="background: #e81123; color: #fff; display: inline-block; padding: 14px 28px; border-radius: 10px; letter-spacing: 5px; font-size: 30px; font-weight: bold;">
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
