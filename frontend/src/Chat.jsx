import "./Chat.css";
import { useContext, useState, useEffect } from "react";
import MyContext from "./Mycontext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);


  useEffect(() => {
    if (!reply) return;

    const content = reply.split("");
    let idx = 0;

    setLatestReply("");

    const interval = setInterval(() => {
      idx += 6;
      setLatestReply(content.slice(0, idx).join(""));

      if (idx >= content.length) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [reply]);

  const lastChat = prevChats?.[prevChats.length - 1];

  const visibleChats =
    lastChat?.role === "assistant"
      ? prevChats.slice(0, -1)
      : prevChats;

  return (
    <div className="chats">
      {visibleChats?.map((chat, idx) => (
        <div
          className={chat.role === "user" ? "userDiv" : "gptDiv"}
          key={idx}
        >
          <p className={chat.role === "user" ? "userMessage" : "gptMessage"}>
            {chat.content}
          </p>
        </div>
      ))}

  

      {lastChat?.role === "assistant" && latestReply !== null && (
        <div className="gptDiv">
          <div className="gptMessage">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {latestReply}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {lastChat?.role === "assistant" && latestReply === null && (
        <div className="gptDiv">
          <div className="gptMessage">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {prevChats[prevChats.length - 1]?.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;