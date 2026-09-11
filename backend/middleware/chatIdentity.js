import { randomUUID } from "node:crypto";

const GUEST_SESSION_DURATION = 3 * 24 * 60 * 60 * 1000;
const USER_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

const chatIdentity = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    req.chatOwner = {
      userId: req.user._id
    };

    req.chatExpiresAt = null;
    req.session.cookie.maxAge = USER_SESSION_DURATION;

    return next();
  }

  const isNewGuest = !req.session.guestId;
  if (isNewGuest) {
    req.session.guestId = randomUUID();
  }

  req.session.cookie.maxAge = GUEST_SESSION_DURATION;

  req.chatOwner = {
    guestId: req.session.guestId
  };

  req.chatExpiresAt = new Date(
    Date.now() + GUEST_SESSION_DURATION
  );

  if (isNewGuest) {
    req.session.save((err) => {
      if (err) {
        console.error("Error saving guest session:", err);
        return res.status(500).json({
          error: "Unable to initialize session"
        });
      }
      next();
    });
  } else {
    next();
  }
};

export {
  GUEST_SESSION_DURATION,
  USER_SESSION_DURATION
};

export default chatIdentity;