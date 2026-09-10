import express from "express";
import passport from "passport";
import User from "../models/user.js";

const router = express.Router();

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role
});

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Username, email and password are required"
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 2 || cleanUsername.length > 30) {
      return res.status(400).json({
        error: "Username must be between 2 and 30 characters"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must contain at least 8 characters"
      });
    }

    const emailAlreadyExists = await User.exists({
      email: cleanEmail
    });

    if (emailAlreadyExists) {
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password
    });

    req.logIn(user, (loginError) => {
      if (loginError) {
        console.error("Signup session error:", loginError);

        return res.status(500).json({
          error: "Account created, but login session could not be started"
        });
      }

      return res.status(201).json({
        message: "Account created successfully",
        user: formatUser(user)
      });
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    if (error.name === "ValidationError") {
      const validationMessage = Object.values(error.errors)
        .map((validationError) => validationError.message)
        .join(", ");

      return res.status(400).json({
        error: validationMessage
      });
    }

    return res.status(500).json({
      error: "Unable to create account"
    });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (authenticationError, user, info) => {
    if (authenticationError) {
      console.error("Login authentication error:", authenticationError);

      return res.status(500).json({
        error: "Unable to log in"
      });
    }

    if (!user) {
      return res.status(401).json({
        error: info?.message || "Invalid email or password"
      });
    }

    req.logIn(user, (loginError) => {
      if (loginError) {
        console.error("Login session error:", loginError);

        return res.status(500).json({
          error: "Unable to start login session"
        });
      }

      return res.status(200).json({
        message: "Logged in successfully",
        user: formatUser(user)
      });
    });
  })(req, res, next);
});

router.get("/me", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(200).json({
      authenticated: false,
      user: null
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: formatUser(req.user)
  });
});

router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  req.logout((logoutError) => {
    if (logoutError) {
      console.error("Logout error:", logoutError);

      return res.status(500).json({
        error: "Unable to log out"
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        console.error("Session destruction error:", sessionError);

        return res.status(500).json({
          error: "Unable to destroy login session"
        });
      }

      res.clearCookie("relay.sid", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/"
      });

      return res.status(200).json({
        message: "Logged out successfully"
      });
    });
  });
});

export default router;