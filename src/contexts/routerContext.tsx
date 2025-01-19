import React, { createContext, useContext, useState, ReactNode } from "react";

interface RouterContextType {
  route: string;
  setRoute: (route: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
};

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const [route, setRoute] = useState("tld");

  return (
    <RouterContext.Provider value={{ route, setRoute }}>
      {children}
    </RouterContext.Provider>
  );
};
