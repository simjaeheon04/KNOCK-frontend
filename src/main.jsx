import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { KnockProvider } from "./context/KnockContext";
import "./styles/global.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <KnockProvider>
        <App />
      </KnockProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
