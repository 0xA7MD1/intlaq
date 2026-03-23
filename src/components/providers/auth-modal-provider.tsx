"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AuthModal } from "@/components/auth/auth-modal";

interface AuthModalContextType {
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

// ✅ تأكد من وجود كلمة export قبل function
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");

  const openLogin = () => {
    setTab("login");
    setIsOpen(true);
  };

  const openRegister = () => {
    setTab("register");
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, close }}>
      {children}
      <AuthModal open={isOpen} onOpenChange={setIsOpen} defaultTab={tab} />
    </AuthModalContext.Provider>
  );
}

// ✅ تأكد من وجود export قبل const
export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
};