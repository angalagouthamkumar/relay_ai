import "./Sidebar.css";
import {
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import MyContext from "./Mycontext";
import { v4 as uuidv4 } from "uuid";


function Sidebar({ isOpen = false, onClose = () => {} }) {
    const {
    allThreads,
    setAllThreads,
    setNewChat,
    setPrompt,
    setReply,
    setThreadId,
    threadId,
    setPrevChats,
    currentUser,
    authLoading,
    setCurrentUser,
    setIsAuthModalOpen,
    setAuthMode
  } = useContext(MyContext);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getAllThreads = useCallback(async () => {
    try {
      const response = await fetch(
        "https://relay-ai-v9uy.onrender.com/chat/threads",
        {
          method: "GET",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("Unable to fetch conversations");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid conversations response");
      }

      const filteredThreads = data.map((thread) => ({
        id: thread._id,
        threadId: thread.threadId,
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        pinned: thread.pinned || false
      }));

      setAllThreads(filteredThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setAllThreads([]);
    }
  }, [setAllThreads]);

  useEffect(() => {
    if (authLoading) return;

    getAllThreads();
  }, [authLoading, currentUser, getAllThreads]);

  useEffect(() => {
  const closeMenu = () => {
    setOpenMenuId(null);
    setIsProfileMenuOpen(false);
  };

  document.addEventListener("click", closeMenu);

  return () => {
    document.removeEventListener("click", closeMenu);
  };
}, []);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setThreadId(uuidv4());
    setPrevChats([]);
    onClose();
  };

  const openAuthModal = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
    setIsProfileMenuOpen(false);
    onClose();
  };

  const logoutUser = async () => {
    try {
      const response = await fetch("https://relay-ai-v9uy.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to log out");
      }

      setCurrentUser(null);
      setAllThreads([]);
      setNewChat(true);
      setPrompt("");
      setReply(null);
      setThreadId(uuidv4());
      setPrevChats([]);
      setIsProfileMenuOpen(false);
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const changeThread = async (id, threadId) => {
    setThreadId(threadId);
    try {
      const response = await fetch(`https://relay-ai-v9uy.onrender.com/chat/threads/${id}`, {
        method: "GET",
        credentials: "include"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open conversation");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid conversation response");
      }

      setPrevChats(data);
      setNewChat(false);
      setPrompt("");
      setReply(null);
      onClose();
    }
    catch(error){
      console.error("Error changing thread:", error);
    }
  };
  const pinThread = async (id) => {
    try {
      const response = await fetch(
        `https://relay-ai-v9uy.onrender.com/chat/threads/${id}/pin`,
        {
          method: "PATCH",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("Unable to pin thread");
      }

      const data = await response.json();

      setAllThreads((prev) => {
        const updatedThreads = prev.map((thread) =>
          thread.id === id
            ? { ...thread, pinned: data.pinned }
            : thread
        );

        return updatedThreads.sort(
          (first, second) =>
            Number(second.pinned) - Number(first.pinned)
        );
      });

      setOpenMenuId(null);
    } catch (error) {
      console.error("Error pinning thread:", error);
    }
  };

  const deleteThread = async (id) => {
    try {
      const response = await fetch(`https://relay-ai-v9uy.onrender.com/chat/threads/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setAllThreads((prev) =>
          prev.filter((thread) => thread.id !== id)
        );
        setOpenMenuId(null);
      } else {
        console.error("Error deleting thread:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  return (
    <section
      className={`sidebar ${isOpen ? "open" : ""}`}
      aria-label="Conversation sidebar"
    >
      {/* new chat btn */}
      <button className="new-chat-btn" onClick={createNewChat}>
        <span className="sidebar-brand-logo" aria-hidden="true">
            <i className="fa-solid fa-bolt"></i>
          </span>
         <span><i className="fa-solid fa-pen-to-square"></i></span>
      </button>

      <ul className="history">
        {allThreads.map((thread) => (
          <li
            className={`thread-item ${
              thread.threadId === threadId ? "active" : ""
            }`}
            key={thread.id}
            onClick={() => changeThread(thread.id, thread.threadId)}
          >
            <span className="thread-title">{thread.title}</span>

            <div className="thread-actions">
              <button
                type="button"
                className="kebab-btn"
                aria-label="Conversation options"
                onClick={(event) => {
                  event.stopPropagation(); // stop click event from bubbling up
                  setOpenMenuId(
                    openMenuId === thread.id ? null : thread.id
                  );
                }}
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>

              {openMenuId === thread.id && (
                <div
                  className="thread-menu"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={thread.pinned ? "pin-option pinned" : "pin-option"}
                    onClick={() => pinThread(thread.id)}
                  >
                    <i className="fa-solid fa-thumbtack"></i>
                    <span>
                      {thread.pinned ? "Unpin this chat" : "Pin this chat"}
                    </span>
                  </button>

                  <button type="button" className="delete-option" onClick={() => deleteThread(thread.id)}>
                    <i className="fa-regular fa-trash-can"></i>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div
        className="account-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={`profile-button ${
            currentUser ? "authenticated" : ""
          }`}
          disabled={authLoading}
          onClick={() => {
            if (currentUser) {
              setIsProfileMenuOpen((current) => !current);
            } else {
              openAuthModal();
            }
          }}
        >
          <span className="profile-avatar">
            {currentUser ? (
              currentUser.username.charAt(0).toUpperCase()
            ) : (
              <i className="fa-regular fa-user"></i>
            )}
          </span>

          <span className="profile-content">
            <span className="profile-name">
              {authLoading
                ? "Checking account..."
                : currentUser?.username || "Log in / Sign up"}
            </span>

            {/* <span className="profile-status">
              {currentUser
                ? "Your conversations are saved"
                : "Save and sync your chats"}
            </span> */}
          </span>

          {currentUser && (
            <i
              className={`fa-solid fa-chevron-${
                isProfileMenuOpen ? "down" : "right"
              } profile-chevron`}
            ></i>
          )}
        </button>

        {currentUser && isProfileMenuOpen && (
          <div className="profile-menu">
            <div className="profile-menu-user">
              <span className="profile-menu-name">
                {currentUser.username}
              </span>

              <span className="profile-menu-email">
                {currentUser.email}
              </span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={logoutUser}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Log out</span>
            </button>
          </div>
        )}

        <div className="sign">
          <p>
            Developed by{" "}
            <a
              href="https://github.com/angalagouthamkumar"
              target="_blank"
              rel="noreferrer"
            >
              Goutham Kumar
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Sidebar;