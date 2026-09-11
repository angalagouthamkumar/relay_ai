import { createContext } from "react";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://relay-ai-v9uy.onrender.com";

const MyContext = createContext();

export default MyContext;
