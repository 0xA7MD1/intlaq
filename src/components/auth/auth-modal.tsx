"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Signup from "@/components/auth/sign-up";
import Signin from "@/components/auth/sign-in";
import OnboardingForm from "@/components/auth/onboarding-form";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  forceOnboarding?: ( arg0: boolean) => void;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", forceOnboarding }: AuthModalProps) {
  
  // إذا كان هناك Onboarding إجباري، نغير العنوان والوصف ليناسب المرحلة
  const title = forceOnboarding ? "إكمال الملف الشخصي" : "أهلاً بك في انطلاق 🚀";
  const description = forceOnboarding 
    ? "لنخصص تجربتك، نحتاج لبعض المعلومات الإضافية" 
    : "سجل دخولك للمتابعة إلى لوحة التحكم";


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-md p-0 overflow-hidden bg-card border border-border rounded-3xl gap-0">
        
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center tracking-tight">
              {forceOnboarding ? (
                <span className="text-primary">{title}</span>
              ) : (
                <>أهلاً بك في <span className="text-primary">انطلاق</span> 🚀</>
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
               {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* إذا لم يكن هناك Onboarding، نعرض نظام التبويبات المعتاد */}
        {!forceOnboarding ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="px-6 pb-2">
              <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-secondary/50 rounded-xl">
                <TabsTrigger 
                  value="login" 
                  className="h-full rounded-lg font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary"
                >
                  تسجيل دخول
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="h-full rounded-lg font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary"
                >
                  حساب جديد
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 pt-2">
              <Signin onOpenChange={onOpenChange} />
              <Signup onOpenChange={onOpenChange} />
            </div>
          </Tabs>
        ) : (
          /* في حالة الـ Onboarding، نعرض الفورم مباشرة بدون تبويبات */
          <div className="p-6 pt-2">
            <OnboardingForm forceOnboarding={forceOnboarding} onOpenChange={onOpenChange} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}