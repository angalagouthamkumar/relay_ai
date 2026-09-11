import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import "./Chatwindow.css";
import MyContext from "./Mycontext";
import { SyncLoader } from "react-spinners";
import Chat from "./Chat";
import SplitText from "./SplitText";

function ChatWindow({ onOpenSidebar = () => {} }) {
    const {
    prompt,
    setPrompt,
    setReply,
    threadId,
    setPrevChats,
    setNewChat,
    setAllThreads,
    newChat,
    prevChats,
    currentUser
  } = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const previousThreadIdRef = useRef(threadId);
  const threadChangePendingRef = useRef(false);
  const firstName = currentUser?.username?.trim().split(/\s+/)[0] || "there";

  const showWelcome =
    newChat &&
    Array.isArray(prevChats) &&
    prevChats.length === 0;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (!chatEndRef.current) return;

    isProgrammaticScrollRef.current = true;

    chatEndRef.current.scrollIntoView({
      behavior,
      block: "end"
    });

    window.clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, behavior === "smooth" ? 600 : 50);
  }, []);

  useLayoutEffect(() => {
    if (previousThreadIdRef.current !== threadId) {
      previousThreadIdRef.current = threadId;
      threadChangePendingRef.current = true;
      shouldAutoScrollRef.current = true;
    }
  }, [threadId]);

  useLayoutEffect(() => {
    if (!shouldAutoScrollRef.current) return;

    const behavior = threadChangePendingRef.current
      ? "auto"
      : "smooth";

    threadChangePendingRef.current = false;

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom(behavior);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [prevChats, isLoading, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    let frameId;

    const observer = new MutationObserver(() => {
      if (
        !shouldAutoScrollRef.current ||
        isProgrammaticScrollRef.current
      ) {
        return;
      }

      window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [scrollToBottom]);

  useEffect(() => {
    return () => {
      window.clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;

    if (!container || isProgrammaticScrollRef.current) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const handleUserScrollIntent = () => {
    isProgrammaticScrollRef.current = false;
    window.clearTimeout(scrollTimeoutRef.current);

    window.requestAnimationFrame(handleMessagesScroll);
  };

  const getReply = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;
    shouldAutoScrollRef.current = true;
    setPrompt(""); // Clear input right away
    setIsLoading(true);
    setNewChat(false); // Reset new chat state if needed

    // 1. Append User Message immediately to state
    setPrevChats((prev) => [...prev, { role: "user", content: currentPrompt }]);

    const options = {
      method: "POST",
      credentials: "include",
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reply");
      }

      // console.log(data);
      setReply(data.reply);

      if (data.thread) {
        const updatedThread = {
          id: data.thread._id,
          threadId: data.thread.threadId,
          title: data.thread.title,
          createdAt: data.thread.createdAt,
          updatedAt: data.thread.updatedAt,
          pinned: data.thread.pinned || false
        };

        setAllThreads((previousThreads) => {
          const threadExists = previousThreads.some(
            (existingThread) =>
              existingThread.id === updatedThread.id
          );

          const updatedThreads = threadExists
            ? previousThreads.map((existingThread) =>
                existingThread.id === updatedThread.id
                  ? updatedThread
                  : existingThread
              )
            : [updatedThread, ...previousThreads];

          return updatedThreads.sort((first, second) => {
            if (first.pinned !== second.pinned) {
              return Number(second.pinned) - Number(first.pinned);
            }

            return (
              new Date(second.updatedAt).getTime() -
              new Date(first.updatedAt).getTime()
            );
          });
        });
      }

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
      <header className="chat-header">
        <button
          type="button"
          className="mobile-sidebar-button"
          aria-label="Open conversation menu"
          onClick={onOpenSidebar}
        >
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>

        <h2>Relay AI</h2>

        <div className="navbar">
          <span className="nav-item">
            Gemma 4 <i className="fa-solid fa-chevron-down"></i>
          </span>
        </div>
      </header>

      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        onWheel={handleUserScrollIntent}
        onTouchMove={handleUserScrollIntent}
      > 
        {showWelcome && (
          <div className="new-chat-welcome">
            <SplitText
              key={firstName}
              tag="h1"
              text={`Hi, ${firstName}. What are we building today?`}
              className="new-chat-welcome-text"
              delay={140}
              duration={1.4}
              ease="power3.out"
              splitType="words"
              from={{
                opacity: 0,
                y: 36,
                filter: "blur(8px)"
              }}
              to={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
              }}
              threshold={0}
              rootMargin="0px"
              textAlign="center"
            />
            
          </div>
        )}

        <Chat />
        {isLoading && (
          <div className="assistant-loader-row">
            <div className="assistant-loader">
              <SyncLoader
                color="#C7F36B"
                size={7}
                speedMultiplier={0.8}
              />
            </div>
          </div>
          
        )}
        <div
          ref={chatEndRef}
          className="chat-end-anchor"
          aria-hidden="true"
        />
      </div>

      {/* {isLoading && (
        <div className="loader">
          <SyncLoader color="#b6f45c" size={7} speedMultiplier={0.8} />
        </div>
      )} */}

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