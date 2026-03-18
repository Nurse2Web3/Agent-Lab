import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener("error", (e) => {
  if (!(e.error instanceof Error)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

window.addEventListener("unhandledrejection", (e) => {
  if (!(e.reason instanceof Error)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
