import express from "express";
import models from "../models/thread.js";
const { Thread } = models;
import getOpenAIResponse from "../utils/openai.js";
import chatIdentity from "../middleware/chatIdentity.js";

const router = express.Router();
router.use(chatIdentity);

// router.post("/test", async (req, res) => {
//     try {
//         const newThread = new Thread({
//             threadId: "567",
//             title: "dsmlf"
//         });
//         const response = await newThread.save();
//         res.status(201).send(response);
//     } catch (error) {
//         console.error("Error occurred:", error);
//         res.status(500).send({ error: "Internal Server Error" });
//     }
// });

router.get("/threads", async (req, res) => {
  try {
    const threads = await Thread.find(req.chatOwner).sort({
      pinned: -1,
      updatedAt: -1
    });

    return res.status(200).json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);

    return res.status(500).json({
      error: "Unable to fetch conversations"
    });
  }
});

router.get("/threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findOne({
      _id: threadId,
      ...req.chatOwner
    });

    if (!thread) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    return res.status(200).json(thread.messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);

    return res.status(500).json({
      error: "Unable to fetch conversation"
    });
  }
});

router.patch("/threads/:threadId/pin", async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findOne({
      _id: threadId,
      ...req.chatOwner
    });

    if (!thread) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    thread.pinned = !thread.pinned;

    if (req.chatExpiresAt) {
      thread.expiresAt = req.chatExpiresAt;
    }

    await thread.save();

    return res.status(200).json({
      pinned: thread.pinned
    });
  } catch (error) {
    console.error("Error pinning conversation:", error);

    return res.status(500).json({
      error: "Unable to update conversation"
    });
  }
});

router.delete("/threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findOneAndDelete({
      _id: threadId,
      ...req.chatOwner
    });

    if (!thread) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting conversation:", error);

    return res.status(500).json({
      error: "Unable to delete conversation"
    });
  }
});

router.post("/", async (req, res) => {
  const { threadId, message } = req.body;

  if (
    typeof threadId !== "string" ||
    typeof message !== "string" ||
    !threadId.trim() ||
    !message.trim()
  ) {
    return res.status(400).json({
      error: "Thread ID and message are required"
    });
  }

  const cleanThreadId = threadId.trim();
  const cleanMessage = message.trim();

  try {
    let thread = await Thread.findOne({
      threadId: cleanThreadId,
      ...req.chatOwner
    });

    if (!thread) {
      thread = new Thread({
        threadId: cleanThreadId,
        ...req.chatOwner,
        title: cleanMessage,
        messages: [
          {
            role: "user",
            content: cleanMessage
          }
        ],
        expiresAt: req.chatExpiresAt
      });
    } else {
      thread.messages.push({
        role: "user",
        content: cleanMessage
      });

      thread.expiresAt = req.chatExpiresAt;
    }

    const aiResponse = await getOpenAIResponse(cleanMessage);

    thread.messages.push({
      role: "assistant",
      content: aiResponse
    });

    thread.updatedAt = new Date();
    thread.expiresAt = req.chatExpiresAt;

    await thread.save();

    return res.status(200).json({
    reply: aiResponse,
    temporary: !req.isAuthenticated(),
    thread: {
        _id: thread._id,
        threadId: thread.threadId,
        title: thread.title,
        pinned: thread.pinned,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
    }
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      error: error.message || "Unable to process message"
    });
  }
});

export default router;