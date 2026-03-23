"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ArrowUpRight, Star } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAuthModal } from "../providers/auth-modal-provider";

export function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // 👈 نستخدم الهوك بدلاً من الـ useState
  const { openLogin, openRegister } = useAuthModal();

  const handleAuthAction = (action: "login" | "register") => {
    if (session) {
      router.push("/dashboard");
    } else {
      // 👈 استدعاء بسيط ونظيف
      if (action === "login") openLogin();
      else openRegister();
    }
  };

  return (
    <nav className="w-full border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8 text-primary font-black relative z-10 transition-transform group-hover:rotate-45" />
            <Star className="h-2 w-2 md:h-3 md:w-3 text-primary absolute -top-1 -right-1 fill-primary" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-foreground">
            Intlaq
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            className="text-base font-bold md:text-lg px-6 md:px-8 h-11 md:h-12 rounded-xl cursor-pointer hover:bg-secondary"
            onClick={() => handleAuthAction("login")}
          >
            {session ? "لوحة التحكم" : "تسجيل الدخول"}
          </Button>

          <Button
            size="lg"
            className="font-bold text-base md:text-lg px-6 md:px-8 h-11 md:h-12 rounded-xl transition-transform active:scale-95 cursor-pointer"
            onClick={() => handleAuthAction("register")}
          >
            {session ? "أكمل إنجازك 🚀" : "ابـدأ مجانـاً 🚀"}
          </Button>

          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block"></div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
