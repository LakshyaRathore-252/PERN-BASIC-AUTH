import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { swaggerDocs } from "./config/swagger.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users" , userRoutes)

// Swagger docs
swaggerDocs(app);   // 👈 Mount Swagger after routes


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;