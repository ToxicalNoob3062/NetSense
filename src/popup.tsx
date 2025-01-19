import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Layouts/Popup";
import { RouterProvider } from "./contexts/routerContext";
import { OverlayProvider } from "./contexts/overLayContext";

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <OverlayProvider>
      <RouterProvider>
        <Popup />
      </RouterProvider>
    </OverlayProvider>
  </React.StrictMode>
);
