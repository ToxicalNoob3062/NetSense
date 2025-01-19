import React, { createContext, useContext, useState, ReactNode } from "react";

interface OverlayContextType {
  overlay: string | null;
  setOverlay: (overlay: string | null) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [overlay, setOverlay] = useState<string | null>(null);

  return (
    <OverlayContext.Provider value={{ overlay, setOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
};
