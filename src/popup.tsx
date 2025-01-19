import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./pages/Popup";
import { RouterProvider } from "./contexts/routerContext";

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <RouterProvider>
      <Popup />
    </RouterProvider>
  </React.StrictMode>
);
