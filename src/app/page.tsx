import { Navbar } from "@/components/layout/navbar";
import { Play, CheckCircle2, Dumbbell } from "lucide-react";
import { LandingCtaButton } from "@/components/landing-cta-button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col transition-colors duration-300 ">
      <div className="absolute inset-0 -z-10 h-200 w-full bg-grid" />
      <Navbar />

      {/* Hero Section - نظيف وجدي */}
      <section className="flex-1 flex flex-col items-center pt-24 pb-16 px-4 text-center space-y-10 max-w-5xl mx-auto">
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            نظّم يومك، ركّز أكثر، <br />
            <span className="text-primary">وأنجز بذكاء.</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            انطلاق ليس مجرد قائمة مهام. هو نظام متكامل يجمع بين{" "}
            <span className="text-foreground font-bold">التغذية</span>،{" "}
            <span className="text-foreground font-bold">الرياضة</span>، و{" "}
            <span className="text-foreground font-bold">التركيز</span> ليدخلك في
            حالة &quot;التدفق&quot; (Flow).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <LandingCtaButton />
        </div>

        <div className="pt-4 text-sm text-muted-foreground/60 font-medium">
          <p>لا يحتاج بطاقة ائتمان • مجاني بالكامل حالياً</p>
        </div>

        {/* --- Feature Grid (Bento Style) --- */}
        <div className="w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          {/* كرت التركيز */}
          <div className="bg-card border-2 border-border p-6 rounded-3xl flex flex-col items-start hover:border-habit/40 group transition-colors hover:cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-habit/10 flex items-center justify-center mb-4 text-habit group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">
              مؤقت تركيز ذكي
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ادمج عاداتك مع جلسات بومودورو لتنجز العمل دون تسويف وبأعلى كفاءة.
            </p>
          </div>

          {/* كرت التغذية */}
          <div className="bg-card border-2 border-border p-6 rounded-3xl flex flex-col items-start hover:border-nutrition/40 group transition-colors md:-mt-8 hover:cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-nutrition/10 flex items-center justify-center mb-4 text-nutrition group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">
              تتبع تغذية متطور
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              حلل وجباتك بالذكاء الاصطناعي واعرف السعرات والماكروز بضغطة زر.
            </p>
          </div>

          <div className="bg-card border-2 border-border p-6 rounded-3xl flex flex-col items-start hover:border-workout/40 transition-colors group hover:cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-workout/10 flex items-center justify-center mb-4 text-workout group-hover:scale-110 transition-transform">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">
              تمارين
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              سجل تمارينك، عداتك، وأوزانك بدقة. تتبع تقدمك العضلي وحرق السعرات
              يوماً بيوم.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center border-t bg-card/50 mt-auto">
        <p className="text-sm text-muted-foreground">
          © 2026 انطلاق. صُنع بشغف للمنجزين. 🚀
        </p>
      </footer>
    </main>
  );
}
