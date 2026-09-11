import models from "../models/thread.js";

const { Thread } = models;

const transferGuestChats = async (guestId, userId) => {
  if (!guestId || !userId) {
    return 0;
  }

  const result = await Thread.updateMany(
    {
      guestId,
      userId: null
    },
    {
      $set: {
        userId,
        guestId: null,
        expiresAt: null
      }
    }
  );

  return result.modifiedCount;
};

export default transferGuestChats;