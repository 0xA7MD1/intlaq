import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import { OnboardingGuard } from "@/components/dashboard/onboarding-guard";
import { TimerManager } from "@/components/dashboard/timer-manager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <TimerManager />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex h-screen overflow-hidden bg-background relative ">
          {/* الخلفية: خليناها fixed عشان ما تتحرك وتسبب لاق مع السكرول */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-grid opacity-50 pointer-events-none" />

          <Sidebar />

          {/* 👇 هنا التغيير المهم: أضفنا no-scrollbar */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
            <BottomNav />

            <div className="absolute top-6 left-6 z-50">
              <ThemeToggle />
            </div>

            <main className="flex-1 w-full pt-4 pb-12 md:pt-8 lg:pb-8">
              {children}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </OnboardingGuard>
  );
}
