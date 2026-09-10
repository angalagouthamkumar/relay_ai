import { useContext, useEffect, useState } from "react";
import "./AuthModal.css";
import MyContext from "./Mycontext";

function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    setCurrentUser
  } = useContext(MyContext);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = authMode === "signup";

  useEffect(() => {
    if (!isAuthModalOpen) return;

    setFormData({
      username: "",
      email: "",
      password: ""
    });

    setFormError("");
    setShowPassword(false);
  }, [isAuthModalOpen, authMode]);

  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsAuthModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isAuthModalOpen, isSubmitting, setIsAuthModalOpen]);

  const closeModal = () => {
    if (isSubmitting) return;

    setIsAuthModalOpen(false);
    setFormError("");
  };

  const changeMode = (mode) => {
    if (isSubmitting) return;

    setAuthMode(mode);
    setFormError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = formData.username.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (isSignup && cleanUsername.length < 2) {
      setFormError("Username must contain at least 2 characters.");
      return;
    }

    if (!cleanEmail) {
      setFormError("Enter your email address.");
      return;
    }

    if (formData.password.length < 8) {
      setFormError("Password must contain at least 8 characters.");
      return;
    }

    const endpoint = isSignup ? "signup" : "login";

    const requestBody = isSignup
      ? {
          username: cleanUsername,
          email: cleanEmail,
          password: formData.password
        }
      : {
          email: cleanEmail,
          password: formData.password
        };

    try {
      setIsSubmitting(true);
      setFormError("");

      const response = await fetch(
        `http://localhost:3000/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setCurrentUser(data.user);
      setIsAuthModalOpen(false);

      setFormData({
        username: "",
        email: "",
        password: ""
      });
    } catch (error) {
      setFormError(error.message || "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          type="button"
          className="auth-close"
          onClick={closeModal}
          aria-label="Close authentication window"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="auth-brand">
          <div className="auth-brand-mark">
            <i className="fa-solid fa-bolt"></i>
          </div>

          <span>Relay AI</span>
        </div>

        <div className="auth-heading">
          <h2 id="auth-title">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>

          <p>
            {isSignup
              ? "Save your conversations and continue from anywhere."
              : "Continue your conversations securely."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => changeMode("login")}
          >
            Log in
          </button>

          <button
            type="button"
            className={authMode === "signup" ? "active" : ""}
            onClick={() => changeMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>

              <div className="auth-input-wrapper">
                <i className="fa-regular fa-user"></i>

                <input
                  id="auth-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Goutham Kumar"
                  autoComplete="username"
                  maxLength={30}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>

            <div className="auth-input-wrapper">
              <i className="fa-regular fa-envelope"></i>

              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>

            <div className="auth-input-wrapper">
              <i className="fa-solid fa-lock"></i>

              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 8 characters"
                autoComplete={isSignup ? "new-password" : "current-password"}
                disabled={isSubmitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                <i
                  className={
                    showPassword
                      ? "fa-regular fa-eye-slash"
                      : "fa-regular fa-eye"
                  }
                ></i>
              </button>
            </div>
          </div>

          {formError && (
            <div className="auth-error" role="alert">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Please wait</span>
              </>
            ) : (
              <span>{isSignup ? "Create account" : "Log in"}</span>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to Relay AI?"}

          <button
            type="button"
            onClick={() => changeMode(isSignup ? "login" : "signup")}
            disabled={isSubmitting}
          >
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;