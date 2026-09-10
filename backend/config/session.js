import session from "express-session";
import MongoStore from "connect-mongo";

const createSessionMiddleware = () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing from the .env file");
  }

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing from the .env file");
  }

  const isProduction = process.env.NODE_ENV === "production";

  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    collectionName: "sessions",
    touchAfter: 24 * 60 * 60
  });

  sessionStore.on("error", (error) => {
    console.error("Session store error:", error);
  });

  return session({
    name: "relay.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  });
};

export default createSessionMiddleware;