import dotenv from "dotenv";
import app from "./src/app.js";
import "./src/config/database.js";  // ✅ makes sure DB connects

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
