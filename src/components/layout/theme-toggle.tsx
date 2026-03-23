"use client";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";
import { useCallback } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();

  // دالة التعامل مع الضغط
  const toggleTheme = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark";

      // 1. التحقق من دعم المتصفح للخاصية. إذا لم يدعمها، نغير الثيم فوراً كحل بديل.
      if (!document.startViewTransition) {
        setTheme(newTheme);
        return;
      }

      // 2. الحصول على إحداثيات مركز الزر الذي تم ضغطه
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // 3. حساب المسافة إلى أبعد زاوية في الشاشة (نصف قطر الدائرة النهائية)
      // نستخدم نظرية فيثاغورس لحساب أبعد نقطة لضمان تغطية الشاشة بالكامل
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      // 4. بدء عملية التحول
      const transition = document.startViewTransition(() => {
        // هذه الدالة تنفذ في المنتصف: هنا نغير الثيم الفعلي
        setTheme(newTheme);
      });

      // 5. بمجرد أن يصبح المتصفح جاهزاً، نبدأ الأنيميشن يدوياً
      transition.ready.then(() => {
        // نقوم بعمل أنيميشن على العنصر الجذر باستخدام clip-path دائري
        document.documentElement.animate(
          {
            // يبدأ كدائرة قطرها 0 في موقع الزر، ويتوسع ليغطى الشاشة
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 700, // مدة الأنيميشن (يمكنك زيادتها أو تقليلها)
            easing: "ease-in-out", // شكل الحركة
            // نخبره أن يطبق هذا الأنيميشن على "الطبقة الجديدة" فقط
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    },
    [resolvedTheme, setTheme],
  );

  return (
    <div className={className}>
      <button
        onClick={toggleTheme}
        className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all border relative overflow-hidden flex items-center justify-center
      bg-white border-slate-200 text-slate-800 hover:bg-slate-50
      dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20 dark:border-transparent dark:hover:border-primary/50`}
        aria-label="Toggle Theme"
      >
        {/* وحدنا حجم الأيقونات ليكون 6 (24px) في جميع الشاشات عشان تكون واضحة */}
        <SunIcon className="h-6 w-6 text-base block dark:hidden transform transition-transform duration-500 rotate-0 dark:rotate-90" />

        <MoonIcon className="h-6 w-6 text-base hidden dark:block transform transition-transform duration-500 rotate-90 dark:rotate-0" />
      </button>
    </div>
  );
}
