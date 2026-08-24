"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from '@/lib/vymc-session';

interface CongregationContextType {
  congregationName: string;
  updateCongregationName: (name: string) => void;
}

const CongregationContext = createContext<CongregationContextType | undefined>(undefined);

export function CongregationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [congregationName, setCongregationName] = useState<string>("");

  // Initialize from session
  useEffect(() => {
    if (session?.user) {
      setCongregationName(session.user.congregationName || "");
    }
  }, [session]);

  const updateCongregationName = (name: string) => {
    setCongregationName(name);
  };

  return (
    <CongregationContext.Provider value={{ congregationName, updateCongregationName }}>
      {children}
    </CongregationContext.Provider>
  );
}

export function useCongregation() {
  const context = useContext(CongregationContext);
  if (context === undefined) {
    throw new Error("useCongregation must be used within a CongregationProvider");
  }
  return context;
}
