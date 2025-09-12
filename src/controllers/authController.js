import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { convertBigIntToString, generateOtp } from "../utils/helper.js";
import { signupOtpTemplate } from "../utils/Templates/emailTemplates.js";
import { forgotPasswordOtpTemplate } from "../utils/Templates/ForgotPassword.js";
import { sendEmail } from "../services/emailService.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "1d"; // token expiry

// ✅ Signup - store data in PendingUser + send OTP
export const signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      gender,
      profilePic,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pin,
    } = req.body;

    // ✅ validate required fields
    if (
      !username || !email || !password ||
      !firstName || !lastName || !gender ||
      !phone || !addressLine1 || !city ||
      !state || !country || !pin
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // ✅ hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ generate OTP
    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ save pending user
    const pUser = await prisma.pendingUser.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        gender,
        profilePic,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        pin,
      },
    });

    const { passwordHash: _ignored, ...pUserWithoutPassword } = pUser;



    // ✅ store OTP separately
    await prisma.otpVerification.create({
      data: { otp, email, expiresAt },
    });

    // ✅ send verification email
    await sendEmail(
      email,
      "Verify your email with OTP",
      signupOtpTemplate(username, otp)
    );

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete signup.",
      data: convertBigIntToString(pUserWithoutPassword),
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};

// ✅ Verify OTP -> move user from PendingUser → User
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    console.log(email, otp)

    // get pending user first
    const pendingUser = await prisma.pendingUser.findFirst({ where: { email } });
    if (!pendingUser) {
      return res.status(404).json({ message: "Pending user not found" });
    }

    // check OTP by userId
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email: pendingUser.email, otp },
      orderBy: { createdAt: "desc" },
    });
    console.log(otpRecord);

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // ✅ OTP valid → create real user
    const user = await prisma.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        passwordHash: pendingUser.passwordHash, // already hashed
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        gender: pendingUser.gender,
        isVerified: true,
        profile: {
          create: {
            profilePic: pendingUser.profilePic,
            phone: pendingUser.phone,
            addressLine1: pendingUser.addressLine1,
            addressLine2: pendingUser.addressLine2,
            city: pendingUser.city,
            state: pendingUser.state,
            country: pendingUser.country,
            pin: pendingUser.pin,
          },
        },
      },
    });

    // cleanup
    await prisma.$transaction([
      prisma.otpVerification.delete({ where: { id: otpRecord.id } }),
      prisma.pendingUser.delete({ where: { id: pendingUser.id } }),
    ]);

    // generate token
    const token = jwt.sign(
      { userId: String(user.id), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ✅ set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Signup complete!",
      data: {
        userId: String(user.id),
        token, // optional, cookie already set
      }
    });

  } catch (error) {
    console.error("verifySignupOtp error:", error);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};


// ✅ Signin
// SIGNIN - fixed
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Remove passwordHash and convert BigInt to string
    const { passwordHash, ...userWithoutPassword } = user;
    const safeUser = convertBigIntToString(userWithoutPassword);

    const token = jwt.sign(
      { userId: String(user.id), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ✅ Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only https in prod
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Signin successful",
      data: {
        user: convertBigIntToString(safeUser),
        token, // optional, since it’s already in cookie
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      success: false,
      message: "Signin failed",
    });
  }
};


// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({
      success: false,
      message: "User not found"
    });

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);


    await prisma.otpVerification.create({
      data: { otp, userId: user.id, expiresAt },
    });

    await sendEmail(
      email,
      "Reset your password with OTP",
      forgotPasswordOtpTemplate(otp, user.username,)
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "OTP sent to email. Please verify to reset password.",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    
    if (!req.body) return res.status(400).json({
      success: false, message: "All fields are required"
    });

    const { otp, newPassword, email } = req.body;
    console.log(req.body);
    console.log(email, otp, newPassword);

    if (!email || !otp || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required"
      });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpRecord = await prisma.otpVerification.findFirst({
      where: { userId: user.id, otp },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > otpRecord.expiresAt)
      return res.status(400).json({ message: "OTP expired" });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

    const token = jwt.sign(
      { userId: String(user.id), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: {
        token
      }
    });
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};



// CHange Password
export const changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const email = req.user.email;
    const { currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, old password, and new password are required"
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.status(200).json({ success: true, message: "Password changed successfully" });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Password change failed" });
  }
};


// LOgout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token"); // remove JWT cookie...
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong while Logging out" });
  }
};