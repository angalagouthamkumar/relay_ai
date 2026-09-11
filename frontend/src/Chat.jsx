import "./Chat.css";
import { useContext, useState, useEffect } from "react";
import MyContext from "./Mycontext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

function Chat() {
  const { prevChats, reply, setReply, threadId } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);

  // Reset typewriter state on thread switch
  useEffect(() => {
    setLatestReply(null);
  }, [threadId]);

  useEffect(() => {
    if (!reply) {
      setLatestReply(null);
      return;
    }

    const content = reply.split("");
    let idx = 0;

    setLatestReply("");

    const interval = setInterval(() => {
      idx += 6;
      if (idx >= content.length) {
        clearInterval(interval);
        setLatestReply(null);
        if (setReply) setReply(null);
      } else {
        setLatestReply(content.slice(0, idx).join(""));
      }
    }, 20);

    return () => {
      clearInterval(interval);
      setLatestReply(null);
    };
  }, [reply, setReply, threadId]);

  return (
    <div className="chats">
      {prevChats?.map((chat, idx) => {
        const isLast = idx === prevChats.length - 1;
        const isCurrentlyTyping =
          isLast && chat.role === "assistant" && Boolean(reply);
        const messageContent = isCurrentlyTyping
          ? (latestReply ?? "")
          : chat.content;
        const stableKey =
          chat._id ||
          chat.id ||
          (chat.timestamp
            ? `${chat.role}-${chat.timestamp}-${idx}`
            : `${chat.role}-${idx}-${chat.content?.slice(0, 16)}`);

        if (chat.role === "user") {
          return (
            <div className="userDiv" key={stableKey}>
              <p className="userMessage">{messageContent}</p>
            </div>
          );
        }

        return (
          <div className="gptDiv" key={stableKey}>
            <div className="gptMessage">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {messageContent}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Chat;