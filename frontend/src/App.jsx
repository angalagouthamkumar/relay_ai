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

  return (
    <MyContext.Provider value={providerValue}>
      <div className="App">
        <Sidebar />
        <div className="main">
          <ChatWindow />
        </div>
      </div>
      <AuthModal />
    </MyContext.Provider>
  );
}

export default App;