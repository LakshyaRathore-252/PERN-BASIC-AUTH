import pkg from "@prisma/client";
import { normalizeUser } from "../utils/helper.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "1d"; // token expiry


// utility to safely convert BigInt values


export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User id is required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) } // if your schema uses BigInt
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    const safeUser = normalizeUser(userWithoutPassword);

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: safeUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};
