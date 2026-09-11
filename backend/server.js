import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import passport from "./config/passport.js";
import createSessionMiddleware from "./config/session.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();

// Production-safe proxy trust for Render / reverse proxies (single hop)
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(createSessionMiddleware());
app.use(passport.initialize());
app.use(passport.session());
app.use("/chat", chatRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

connectToDatabase();

// app.post("/test", async (req, res) => {
//   const { message } = req.body;
//   const options = {
//     method : "POST",
//     headers : {
//       "Authorization": `Bearer ${process.env.UNOROUTER_API_KEY}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: process.env.UNOROUTER_MODEL,
//       messages: [{ role: "user", content: message }]
//     })
//   }
//   try{
//     const response = await fetch(process.env.UNOROUTER_BASE_URL + "/chat/completions", options);
//     const data = await response.json();
//     // console.log(data);
//     res.send(data.choices[0].message.content);
//   }
//   catch{
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });
