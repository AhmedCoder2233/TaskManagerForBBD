import { createContext, useState } from "react";

export const ActiveWorkspaceContext = createContext();

export function ActiveWorkspaceProvider({ children }) {
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  return (
    <ActiveWorkspaceContext.Provider
      value={{ activeWorkspace, setActiveWorkspace }}
    >
      {children}
    </ActiveWorkspaceContext.Provider>
  );
}
