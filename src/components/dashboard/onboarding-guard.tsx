"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client"; 
import { AuthModal } from "@/components/auth/auth-modal";
import { Loader2 } from "lucide-react";
import { getOnboardingStatus } from "@/server/actions/user";
import { useRouter } from "next/navigation";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!session?.user) {
        if (isMounted) setOnboardingCompleted(undefined);
        return;
      }

      try {
        const result = await getOnboardingStatus();
        if (isMounted) setOnboardingCompleted(result.onboardingCompleted);
      } catch {
        if (isMounted) setOnboardingCompleted(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!session) return;
    if (onboardingCompleted !== true) return;
    router.refresh();
  }, [onboardingCompleted, router, session]);

  const isUnauthenticated = !session;
  const isLoadingOnboardingStatus = !!session && onboardingCompleted === undefined;
  const isProfileIncomplete = !!session && onboardingCompleted === false;
  const shouldBlock = isUnauthenticated || isProfileIncomplete;

  // حالة تحميل الانتظار
  if (isPending || isLoadingOnboardingStatus) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // 👇 التغيير هنا: الهيكل ثابت دائماً، المتغير هو الكلاسات وظهور المودال فقط
  return (
    <>
      {/* 1. المودال يظهر شرطياً فقط */}
      {shouldBlock ? (
        <div className="relative z-50">
            <AuthModal 
              open={true} 
              onOpenChange={() => {}}  
              forceOnboarding={isProfileIncomplete ? ((value) => setOnboardingCompleted(value)) : undefined}
            />
        </div>
      ): null}

      {/* 2. المحتوى موجود دائماً في نفس المكان، لكن نغير الستايل حقه */}
      <div 
        className={`transition-all duration-300 ${
          shouldBlock 
            ? "filter blur-xl pointer-events-none select-none h-screen overflow-hidden opacity-50" 
            : ""
        }`}
      >
         {children}
      </div>
    </>
  );
}
