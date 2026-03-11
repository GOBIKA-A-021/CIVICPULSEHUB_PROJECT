import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import { migrateResolvedAt } from './controllers/complaintController.js';

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import aiRoutes from "./routes/ai.js";
import { getOfficers } from "./controllers/complaintController.js";
import authenticate from "./middleware/authMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/grievances", complaintRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ai", aiRoutes);
app.get("/api/officers", authenticate, getOfficers);

const seedDB = async () => {
  try {
    const count = await User.countDocuments();

    if (count === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);

      await User.insertMany([
        { 
          username: "admin_central", 
          name: "Central Admin", 
          email: "admin@city.gov", 
          password: hashedPassword, 
          role: "ADMIN", 
          department: "Administration",
          isActive: true
        },
        { 
          username: "officer_water", 
          name: "Officer Water", 
          email: "water@city.gov", 
          password: hashedPassword, 
          role: "OFFICER", 
          department: "Water Supply",
          departmentKey: "WATER",
          designation: "Water Inspector",
          isActive: true,
          pendingComplaints: 0,
          completedComplaints: 0
        },
        { 
          username: "officer_electricity", 
          name: "Officer Electricity", 
          email: "electric@city.gov", 
          password: hashedPassword, 
          role: "OFFICER", 
          department: "Electricity & Power",
          departmentKey: "ELECTRICITY",
          designation: "Electrical Inspector",
          isActive: true,
          pendingComplaints: 0,
          completedComplaints: 0
        },
        { 
          username: "officer_roads", 
          name: "Officer Roads", 
          email: "roads@city.gov", 
          password: hashedPassword, 
          role: "OFFICER", 
          department: "Roads & Infrastructure",
          departmentKey: "ROADS",
          designation: "Field Specialist",
          isActive: true,
          pendingComplaints: 0,
          completedComplaints: 0
        },
        { 
          username: "officer_sanitation", 
          name: "Officer Sanitation", 
          email: "sanitation@city.gov", 
          password: hashedPassword, 
          role: "OFFICER", 
          department: "Sanitation & Waste",
          departmentKey: "SANITATION",
          designation: "Sanitation Inspector",
          isActive: true,
          pendingComplaints: 0,
          completedComplaints: 0
        },
        { 
          username: "officer_safety", 
          name: "Officer Safety", 
          email: "safety@city.gov", 
          password: hashedPassword, 
          role: "OFFICER", 
          department: "Public Safety",
          departmentKey: "PUBLIC_SAFETY",
          designation: "Safety Officer",
          isActive: true,
          pendingComplaints: 0,
          completedComplaints: 0
        },
        { 
          username: "citizen_jane", 
          name: "Jane Doe", 
          email: "jane@gmail.com", 
          password: hashedPassword, 
          role: "CITIZEN" 
        }
      ]);

      console.log("✅ Database seeded with sample users");
      console.log("   ✓ 1 Admin");
      console.log("   ✓ 5 Officers (WATER, ELECTRICITY, ROADS, SANITATION, PUBLIC_SAFETY)");
      console.log("   ✓ 1 Citizen");
    }
  } catch (err) {
    console.warn("⚠️ Could not seed database:", err.message);
  }
};

async function startServer() {
  await connectDB();
  await seedDB();
  
  // Run migration for resolvedAt field
  try {
    await migrateResolvedAt();
  } catch (err) {
    console.warn("⚠️ Migration for resolvedAt failed:", err.message);
  }

  // In production, serve the frontend static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();