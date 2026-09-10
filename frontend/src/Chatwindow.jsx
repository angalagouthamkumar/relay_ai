import { useContext, useState } from "react";
import "./Chatwindow.css";
import MyContext from "./Mycontext";
import { SyncLoader } from "react-spinners";
import Chat from "./Chat";

function ChatWindow() {
  const { prompt, setPrompt, setReply, threadId, setPrevChats,setNewChat } = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);

  const getReply = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;
    setPrompt(""); // Clear input right away
    setIsLoading(true);
    setNewChat(false); // Reset new chat state if needed

    // 1. Append User Message immediately to state
    setPrevChats((prev) => [...prev, { role: "user", content: currentPrompt }]);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: currentPrompt,
        threadId: threadId,
      }),
    };

    try {
      const response = await fetch("http://localhost:3000/chat", options);
      const data = await response.json();

      console.log(data);
      setReply(data.reply);

      // 2. Append Assistant Response when received
      if (data && data.reply) {
        setPrevChats((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (error) {
      console.error("Error fetching reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      <h2>Relay AI</h2>
      <div className="navbar">
        <span className="nav-item">
          Gemma 4 <i className="fa-solid fa-chevron-down"></i>
        </span>
      </div>

      <div className="messages-container">
        {/* Render dynamic chat history component */}
        <Chat />
      </div>

      {isLoading && (
        <div className="loader">
          <SyncLoader color="#b6f45c" size={7} speedMultiplier={0.8} />
        </div>
      )}

      <div className="chatInput">
        <div className="userinput">
          <input
            type="text"
            placeholder="Ask anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
          />
          <div id="send" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">Relay can make mistakes.</p>
      </div>
    </div>
  );
}

export default ChatWindow;