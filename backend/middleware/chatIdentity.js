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

  if (!req.session.guestId) {
    req.session.guestId = randomUUID();
  }

  req.session.cookie.maxAge = GUEST_SESSION_DURATION;

  req.chatOwner = {
    guestId: req.session.guestId
  };

  req.chatExpiresAt = new Date(
    Date.now() + GUEST_SESSION_DURATION
  );

  next();
};

export {
  GUEST_SESSION_DURATION,
  USER_SESSION_DURATION
};

export default chatIdentity;