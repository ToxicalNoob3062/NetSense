import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Layouts/Popup";
import { RouterProvider } from "./contexts/routerContext";
import { OverlayProvider } from "./contexts/overLayContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <RouterProvider>
          <Popup />
        </RouterProvider>
      </OverlayProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
