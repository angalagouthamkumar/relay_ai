import "dotenv/config.js";

const getOpenAIResponse = async (input) => {
  let messages = [];

  if (Array.isArray(input)) {
    // Keep provider request within reasonable length (e.g. last 15 messages)
    messages = input.slice(-15).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").trim()
    })).filter((m) => m.content.length > 0);
  } else if (typeof input === "string") {
    messages = [{ role: "user", content: input.trim() }];
  }

  if (messages.length === 0) {
    throw new Error("Cannot send empty message list to AI provider");
  }

  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.UNOROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.UNOROUTER_MODEL,
      messages
    })
  };

  try {
    const response = await fetch(process.env.UNOROUTER_BASE_URL + "/chat/completions", options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI Provider HTTP Error (${response.status}):`, errorText);
      throw new Error(`AI service responded with status ${response.status}`);
    }

    const data = await response.json();

    if (
      !data ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0 ||
      !data.choices[0]?.message?.content
    ) {
      console.error("OpenAI Invalid Payload:", data);
      throw new Error("Invalid response format from AI service");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Fetch Error:", error);
    throw error;
  }
};

export default getOpenAIResponse;