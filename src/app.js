import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app = express();

// ✅ CORS FIRST
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// ✅ Preflight support with regex
app.options(/\/api\/.*/, cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// ✅ Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { swaggerDocs } from "./config/swagger.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
swaggerDocs(app);

export default app;
