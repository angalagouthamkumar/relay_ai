import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import "./Chatwindow.css";
import MyContext, { API_BASE_URL } from "./Mycontext";
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
  const [chatError, setChatError] = useState(null);

  const messagesContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserTouchingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const previousThreadIdRef = useRef(threadId);
  const isThreadSwitchPendingRef = useRef(false);
  const activeThreadIdRef = useRef(threadId);

  const firstName = currentUser?.username?.trim().split(/\s+/)[0] || "there";

  const showWelcome =
    newChat &&
    Array.isArray(prevChats) &&
    prevChats.length === 0;

  // Clear chat error, update active thread ref, and flag thread switch on threadId change
  useEffect(() => {
    activeThreadIdRef.current = threadId;
    setChatError(null);
    setIsLoading(false);
    if (previousThreadIdRef.current !== threadId) {
      previousThreadIdRef.current = threadId;
      isThreadSwitchPendingRef.current = true;
      shouldAutoScrollRef.current = false;
    }
  }, [threadId]);

  // When prevChats change: instant jump to bottom if thread switch, without visible smooth scrolling
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isThreadSwitchPendingRef.current) {
      isThreadSwitchPendingRef.current = false;
      shouldAutoScrollRef.current = true;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (shouldAutoScrollRef.current && !isUserTouchingRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [prevChats, isLoading]);

  // Follow growing assistant typewriter content without competing animations or viewport movement
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (shouldAutoScrollRef.current && !isUserTouchingRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle wheel scrolling: upward scroll immediately pauses auto-follow
  const handleWheel = (event) => {
    if (event.deltaY < 0) {
      shouldAutoScrollRef.current = false;
    } else if (event.deltaY > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 40) {
          shouldAutoScrollRef.current = true;
        }
      }
    }
  };

  // Touch handlers to prevent shaking when dragging during typing
  const handleTouchStart = (event) => {
    isUserTouchingRef.current = true;
    touchStartYRef.current = event.touches[0]?.clientY || 0;
  };

  const handleTouchMove = (event) => {
    const currentY = event.touches[0]?.clientY || 0;
    if (currentY > touchStartYRef.current) {
      // Dragging downward moves content down (scrolling upward)
      shouldAutoScrollRef.current = false;
    }
    touchStartYRef.current = currentY;
  };

  const handleTouchEnd = () => {
    isUserTouchingRef.current = false;
    const container = messagesContainerRef.current;
    if (container) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 40) {
        shouldAutoScrollRef.current = true;
      }
    }
  };

  // Scroll listener on messages container
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 80) {
      shouldAutoScrollRef.current = false;
    } else if (distanceFromBottom < 40) {
      shouldAutoScrollRef.current = true;
    }
  };

  const getReply = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;
    const originatingThreadId = threadId;
    shouldAutoScrollRef.current = true;
    isThreadSwitchPendingRef.current = false;
    setChatError(null);
    setPrompt("");
    setIsLoading(true);
    setNewChat(false);

    // 1. Append User Message immediately to state
    setPrevChats((prev) => [...prev, { role: "user", content: currentPrompt }]);

    // Move to new user message
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    const options = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: currentPrompt,
        threadId: originatingThreadId,
      }),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reply");
      }

      // Only update visible chat and typewriter if user is still viewing the originating thread
      if (activeThreadIdRef.current === originatingThreadId) {
        setReply(data.reply);
        if (data && data.reply) {
          setPrevChats((prev) => [...prev, { role: "assistant", content: data.reply }]);
        }
      }

      // Always update sidebar metadata so thread list stays current
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
    } catch (error) {
      if (activeThreadIdRef.current === originatingThreadId) {
        console.error("Error fetching reply:", error);
        setChatError(error.message || "Failed to send message. Please try again.");
      }
    } finally {
      if (activeThreadIdRef.current === originatingThreadId) {
        setIsLoading(false);
      }
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
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
        {chatError && (
          <div className="chat-error" role="alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{chatError}</span>
          </div>
        )}
        <div
          ref={chatEndRef}
          className="chat-end-anchor"
          aria-hidden="true"
        />
      </div>

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