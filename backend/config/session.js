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

  /**
   * Deployment Topology Notice:
   * Third-party cookie policies in modern browsers can restrict cross-site cookies
   * when frontend and backend are on completely separate domains (e.g., .netlify.app and .onrender.com).
   * The preferred production deployment topology is using the same apex domain:
   * Frontend: relay.goouthamkumar.in
   * Backend:  api.relay.goouthamkumar.in
   * This makes cookies first-party / same-site.
   */
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/"
    }
  });
};

export default createSessionMiddleware;