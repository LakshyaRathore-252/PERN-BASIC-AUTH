import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "1d";

export const oauthLogin = async (req, res) => {
  try {
    const { provider, providerId, email, name, given_name, family_name, picture } = req.body;

    // 1️⃣ Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: name || email.split("@")[0],
          firstName: given_name || null,
          lastName: family_name || null,
          passwordHash: bcrypt.hashSync(Math.random().toString(36), 10), // random hash
        },
      });

      // Optionally create user profile immediately
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          profilePic: picture || null,
        },
      });
    }

    // 2️⃣ Find or create OAuth account
    let account = await prisma.oAuthAccount.findFirst({
      where: { provider, providerId },
    });

    if (!account) {
      account = await prisma.oAuthAccount.create({
        data: {
          provider,
          providerId,
          userId: user.id,
        },
      });
    }

    // 3️⃣ Generate JWT token
    const token = jwt.sign({ userId: user.id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 4️⃣ Send token as HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // 5️⃣ Return full user info
    return res.json({
      success: true,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: {
          profilePic: picture || user.profile?.profilePic || null,
        },
      },
      account: {
        id: account.id.toString(),
        provider: account.provider,
        providerId: account.providerId,
        userId: account.userId.toString(),
      },
    });
  } catch (error) {
    console.error("OAuth login error:", error);
    return res.status(500).json({ error: error.message });
  }
};
