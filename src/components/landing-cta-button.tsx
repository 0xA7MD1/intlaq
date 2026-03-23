"use client";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/providers/auth-modal-provider";

export function LandingCtaButton() {
  const { openLogin } = useAuthModal();

  return (
    <Button
      size="lg"
      className="sm:w-auto text-lg px-8 py-6 rounded-xl font-bold"
      onClick={openLogin}
    >
      جرب الداشبورد الآن ⚡️
    </Button>
  );
}

