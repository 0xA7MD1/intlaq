"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { safeRemoveDashboardCache } from "@/lib/dashboard-cache";
import { 
  LayoutDashboard,
  Flame,
  CheckCircle,
  Dumbbell,
  Settings,
  ArrowUpRight,
  Star,
  LogOut,
  User
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          if (session?.user?.id) safeRemoveDashboardCache(session.user.id);
          router.push("/");
          toast.success("تم تسجيل الخروج");
        },
      },
    });
  };

  const menuItems = [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "التغذية", href: "/dashboard/nutrition", icon: Flame },
    { name: "العادات", href: "/dashboard/habits", icon: CheckCircle },
    { name: "تمرين", href: "/dashboard/workout", icon: Dumbbell },
    { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-72 border-l border-border bg-card hidden lg:flex flex-col h-screen sticky top-0 overflow-hidden z-50 transition-colors duration-300">
      
      {/* --- الشعار (Logo) --- */}
      <div className="h-24 flex items-center px-8 gap-3">
        <div className="relative group cursor-pointer">
           <ArrowUpRight className="h-10 w-10 text-primary font-black relative z-10" />
           <Star className="h-4 w-4 text-accent-foreground absolute -top-1 -right-1 fill-current" />
        </div>
        {/* نص نظيف بدون تأثيرات */}
        <span className="text-3xl font-black tracking-tighter text-foreground">
          انطلاق
        </span>
      </div>

      {/* --- القائمة (Navigation) --- */}
      <nav className="flex-1 w-full space-y-3 px-6 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 gap-4 group mb-2
                  ${isActive 
                    ? // --- حالة التفعيل (Active) ---
                      // Light: لون أساسي كامل
                      "bg-primary text-primary-foreground shadow-md " +
                      // Dark: لون أساسي شفاف (10%)
                      "dark:bg-primary/10 dark:text-primary border border-transparent dark:border-primary/20"
                    : // --- الحالة العادية (Inactive) ---
                      "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                {/* الأيقونة */}
                <item.icon 
                  className={`h-6 w-6 transition-all duration-300
                    ${isActive 
                      ? "text-primary-foreground dark:text-primary" 
                      : "text-muted-foreground group-hover:text-primary"
                    }`} 
                />
                
                {/* النص */}
                <span className="text-sm font-bold">
                  {item.name}
                </span>
                
              </div>
            </Link>
          );
        })}
      </nav>

      {/* --- بطاقة المستخدم (User Profile) --- */}
      <div className="p-6 w-full mt-auto">
        <div 
          onClick={handleSignOut}
          className="relative group cursor-pointer"
        >
          {/* حدود ناعمة متدرجة */}
          <div className="absolute inset-0 bg-linear-to-tr from-primary via-accent to-primary rounded-3xl p-px opacity-70 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative bg-card h-full w-full rounded-[1.4rem] p-4 flex items-center gap-3">
            
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center">
               <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black truncate text-foreground">أحمد علي</p>
              <div className="flex items-center gap-1 text-muted-foreground group-hover:text-destructive transition-colors">
                 <LogOut className="h-3 w-3" />
                 <p className="text-[10px] font-bold uppercase">تسجيل خروج</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}
