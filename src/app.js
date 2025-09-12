import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { swaggerDocs } from "./config/swagger.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: ["http://localhost:3000" , "http://localhost:5000"],   // allow Next.js frontend
    credentials: true,                 // allow cookies/auth headers
}));



// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes)

// Swagger docs
swaggerDocs(app);   // 👈 Mount Swagger after routes


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;