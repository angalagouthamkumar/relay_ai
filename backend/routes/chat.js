import express from "express";
import models from "../models/thread.js";
const { Thread } = models;
import getOpenAIResponse from "../utils/openai.js";

const router = express.Router();

router.post("/test", async (req, res) => {
    try {
        const newThread = new Thread({
            threadId: "567",
            title: "dsmlf"
        });
        const response = await newThread.save();
        res.status(201).send(response);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

router.get("/threads", async (req, res) => {
    try {
        const threads = await Thread.find({}).sort({ pinned: -1, updatedAt: -1 });
        res.status(200).json(threads);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

router.get("/threads/:threadId", async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await Thread.findById(threadId);
        if (!thread) {
            return res.status(404).send({ error: "Thread not found" });
        }
        res.json(thread.messages);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

router.patch("/threads/:threadId/pin", async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).send({ error: "Thread not found" });
    }

    thread.pinned = !thread.pinned;
    await thread.save();

    res.status(200).json({
      pinned: thread.pinned
    });
  } catch (error) {
    console.error("Error pinning thread:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.delete("/threads/:threadId", async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await Thread.findByIdAndDelete(threadId);
        if (!thread) {
            return res.status(404).send({ error: "Thread not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

router.post("/", async (req, res) => {
    const { threadId, message } = req.body;
    if (!threadId || !message) {
        return res.status(400).send({ error: "Thread ID and message are required" });
    }
    try {
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId: threadId,
                title: message,
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }

        const aiResponse = await getOpenAIResponse(message);
        thread.messages.push({ role: "assistant", content: aiResponse });
        thread.updatedAt = Date.now();

        await thread.save();
        res.json({ reply: aiResponse });
    } catch (error) {
        console.error("Error occurred:", error);
                res.status(500).json({
        error: error.message
        });
    }
});

export default router;