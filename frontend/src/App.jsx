import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./Sidebar";
import ChatWindow from "./Chatwindow";
import AuthModal from "./AuthModal";
import MyContext from "./Mycontext";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [threadId, setThreadId] = useState(uuidv4());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const providerValue = {
    prompt,
    setPrompt,
    reply,
    setReply,
    threadId,
    setThreadId,
    prevChats,
    setPrevChats,
    newChat,
    setNewChat,
    allThreads,
    setAllThreads,
    currentUser,
    setCurrentUser,
    authLoading,
    setAuthLoading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode
  };

  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);

      const response = await fetch("http://localhost:3000/auth/me", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Unable to check authentication");
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Authentication check error:", error);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 700) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <MyContext.Provider value={providerValue}>
      <div className="App">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <button
          type="button"
          className={`sidebar-backdrop ${
            isSidebarOpen ? "visible" : ""
          }`}
          aria-label="Close conversation menu"
          tabIndex={isSidebarOpen ? 0 : -1}
          onClick={() => setIsSidebarOpen(false)}
        />

        <div className="main">
          <ChatWindow
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        </div>
      </div>
      <AuthModal />
    </MyContext.Provider>
  );
}

export default App;