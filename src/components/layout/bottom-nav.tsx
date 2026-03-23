"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flame, CheckCircle, Dumbbell, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "تغذية", href: "/dashboard/nutrition", icon: Flame },
    { name: "عادات", href: "/dashboard/habits", icon: CheckCircle },
    { name: "تمرين", href: "/dashboard/workout", icon: Dumbbell },
    { name: "إعدادات", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    // lg:hidden = يختفي في الشاشات الكبيرة (لابتوب) ويظهر في الجوال والآيباد
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border lg:hidden pb-safe">
      <nav className="flex items-center justify-around h-20 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="w-full">
              <div className="flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer group">
                
                {/* الأيقونة */}
                <div className={`p-2.5 rounded-xl transition-all duration-300
                    ${isActive 
                      ? "bg-primary/15 text-primary shadow-sm shadow-primary/30"
                      : "text-muted-foreground group-hover:text-primary/90"
                    }
                `}>
                  <item.icon className="h-6 w-6" />
                </div>

                {/* النص (اختياري - يمكن إخفاؤه في الجوال الصغير جداً إذا رغبت) */}
                <span className={`text-[11px] font-bold leading-none transition-colors duration-300
                    ${isActive ? "text-primary" : "text-muted-foreground"}
                `}>
                  {item.name}
                </span>
                
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
