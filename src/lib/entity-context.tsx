import { createContext, useContext, useState, type ReactNode } from "react";

interface EntityContextValue {
  activeEntityId: string | null;
  setActiveEntityId: (id: string) => void;
}

const EntityContext = createContext<EntityContextValue>({
  activeEntityId: null,
  setActiveEntityId: () => {},
});

export function EntityProvider({ children }: { children: ReactNode }) {
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  return (
    <EntityContext.Provider value={{ activeEntityId, setActiveEntityId }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  return useContext(EntityContext);
}
