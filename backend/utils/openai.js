import "dotenv/config.js";

const getOpenAIResponse = async (message) => {
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.UNOROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.UNOROUTER_MODEL,
      messages: [{ role: "user", content: message }]
    })
  };

  try {
    const response = await fetch(process.env.UNOROUTER_BASE_URL + "/chat/completions", options);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Fetch Error:", error);
    throw error;
  }
};

export default getOpenAIResponse;