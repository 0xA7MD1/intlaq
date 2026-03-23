"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Trash2, Activity, Target, Weight } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, updateUserProfile, deleteWeightHistory } from "@/server/actions/user";
import { hardResetFocusData } from "@/server/actions/focus";
import type { UserData } from "@/types";
import { authClient } from "@/lib/auth-client";

type RawUserProfile = UserData & {
  calorieTargetCalculatedAt?: string | Date | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserData>>({
    name: "",
    email: "",
    weight: 0,
    goal: "maintain",
    activityLevel: "moderate",
    age: 0,
    height: 0,
    gender: "male"
  });

  useEffect(() => {
    if (!session?.user) return;

    const fetchProfile = async () => {
      try {
        const data = (await getUserProfile()) as RawUserProfile | null;
        if (data) {
          const gender: "male" | "female" =
            data.gender === "female" ? "female" : "male";

          const activityLevel: NonNullable<UserData["activityLevel"]> =
            data.activityLevel === "sedentary" ||
            data.activityLevel === "light" ||
            data.activityLevel === "moderate" ||
            data.activityLevel === "active" ||
            data.activityLevel === "very_active"
              ? data.activityLevel
              : "moderate";

          const goal: NonNullable<UserData["goal"]> =
            data.goal === "cut" || data.goal === "bulk" || data.goal === "maintain"
              ? data.goal
              : "maintain";

          let calorieTargetCalculatedAt: string | undefined;
          const rawCalculatedAt = data.calorieTargetCalculatedAt as unknown;
          if (rawCalculatedAt && typeof rawCalculatedAt === "object" && "toISOString" in rawCalculatedAt) {
            try {
              const d = rawCalculatedAt as { toISOString: () => string };
              calorieTargetCalculatedAt = d.toISOString();
            } catch {
              calorieTargetCalculatedAt = undefined;
            }
          } else if (typeof rawCalculatedAt === "string") {
            calorieTargetCalculatedAt = rawCalculatedAt;
          }

          setProfileData({
            ...data,
            gender,
            activityLevel,
            goal,
            calorieTargetCalculatedAt,
          } as Partial<UserData>);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        toast.error("فشل تحميل بيانات الملف الشخصي");
      }
    };

    fetchProfile();
  }, [session?.user]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile(profileData);
      toast.success("تم حفظ التغييرات بنجاح");
      router.refresh();
    } catch {
      toast.error("فشل حفظ التغييرات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFocus = async () => {
    if (!confirm("هل أنت متأكد من حذف كافة بيانات وجلسات التركيز؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setIsLoading(true);
    try {
      await hardResetFocusData();
      toast.success("تم تنظيف كافة بيانات التركيز بنجاح");
      router.refresh();
    } catch {
      toast.error("فشل تنظيف البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع سجلات الوزن السابقة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setIsDeleting(true);
    try {
      await deleteWeightHistory();
      toast.success("تم حذف سجلات الوزن بنجاح");
    } catch {
      toast.error("فشل حذف السجلات");
    } finally {
      setIsDeleting(false);
    }
  };

  const sections = [
    { id: "profile", name: "الملف الشخصي", icon: User },
    { id: "habits", name: "العادات والتركيز", icon: Activity },
    { id: "privacy", name: "الأمان", icon: Shield },
    { id: "danger", name: "منطقة الخطر", icon: Trash2 },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="bg-card border rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                الملف الشخصي الأساسي
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">الاسم الكامل</label>
                  <input
                    type="text"
                    value={profileData.name || ""}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                    placeholder="أدخل اسمك"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={profileData.email || ""}
                    disabled
                    className="w-full p-4 rounded-xl border border-border bg-muted/50 text-muted-foreground text-right cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="h-6 w-6 text-nutrition" />
                بيانات الجسم والأهداف
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Weight className="h-4 w-4" /> الوزن الحالي (كجم)
                  </label>
                  <input
                    type="number"
                    value={profileData.weight || ""}
                    onChange={(e) => setProfileData({...profileData, weight: parseFloat(e.target.value)})}
                    className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> الهدف الحالي
                  </label>
                  <select
                    value={profileData.goal || "maintain"}
                    onChange={(e) => setProfileData({...profileData, goal: e.target.value as "maintain" | "cut" | "bulk"})}
                    className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                  >
                    <option value="maintain">المحافظة على الوزن</option>
                    <option value="cut">تنشيف / خسارة وزن</option>
                    <option value="bulk">تضخيم / زيادة وزن</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">مستوى النشاط</label>
                  <select
                    value={profileData.activityLevel || "moderate"}
                    onChange={(e) => setProfileData({...profileData, activityLevel: e.target.value as "sedentary" | "light" | "moderate" | "active" | "very_active"})}
                    className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                  >
                    <option value="sedentary">خامل (قليل الحركة جداً)</option>
                    <option value="light">نشاط خفيف (مشي خفيف 1-3 أيام)</option>
                    <option value="moderate">نشاط متوسط (تمرين 3-5 أيام)</option>
                    <option value="active">نشيط جداً (تمرين يومي شديد)</option>
                    <option value="very_active">رياضي محترف (تمرين مرتين يومياً)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">الجنس</label>
                    <select
                      value={profileData.gender || "male"}
                      onChange={(e) => setProfileData({...profileData, gender: e.target.value as "male" | "female"})}
                      className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">العمر</label>
                    <input
                      type="number"
                      value={profileData.age || ""}
                      onChange={(e) => setProfileData({...profileData, age: parseInt(e.target.value)})}
                      className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">الطول (سم)</label>
                  <input
                    type="number"
                    value={profileData.height || ""}
                    onChange={(e) => setProfileData({...profileData, height: parseInt(e.target.value)})}
                    className="w-full p-4 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:border-primary transition-all text-right"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </div>
          </div>
        );

      case "habits":
        return (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-card border rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="h-6 w-6 text-primary" />
                إدارة بيانات العادات والتركيز
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-border bg-secondary/30">
                  <h3 className="font-black mb-3">تصفير بيانات التركيز</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    يمكنك تصفير كافة إحصائيات التركيز وسلاسل الأيام إذا واجهت مشاكل في البيانات.
                  </p>
                  <button 
                    onClick={handleResetFocus}
                    disabled={isLoading}
                    className="px-6 py-3 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all font-bold flex items-center justify-center gap-2 rounded-xl"
                  >
                    <Trash2 className="h-5 w-5" />
                    حذف كافة بيانات التركيز
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="bg-card border rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Shield className="h-6 w-6 text-destructive" />
                الأمان وكلمة المرور
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-border bg-secondary/30">
                  <h3 className="font-black mb-3">تغيير كلمة المرور</h3>
                  <p className="text-muted-foreground mb-4 text-sm">يمكنك تحديث كلمة المرور الخاصة بك من هنا. سيتم إرسال رابط تأكيد إلى بريدك الإلكتروني.</p>
                  <button className="px-6 py-2 bg-secondary text-foreground rounded-lg font-bold border border-border hover:bg-secondary/50 transition-all">
                    إرسال رابط تغيير كلمة المرور
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "danger":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-destructive/20 rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-destructive">
                <Trash2 className="h-6 w-6" />
                منطقة الخطر
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
                  <h3 className="font-black mb-2 text-destructive">حذف سجلات الوزن</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    سيتم حذف جميع سجلات الوزن السابقة بشكل نهائي. سيبقى وزنك الحالي فقط في الملف الشخصي.
                    هذا مفيد إذا كنت ترغب في إعادة ضبط الرسم البياني للوزن.
                  </p>
                  <button 
                    onClick={handleDeleteHistory}
                    disabled={isDeleting}
                    className="px-6 py-3 bg-destructive text-white rounded-xl font-bold hover:bg-destructive/90 transition-all disabled:opacity-50"
                  >
                    {isDeleting ? "جاري الحذف..." : "حذف جميع السجلات"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-8 pb-10 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          الإعدادات
        </h1>
        <p className="text-muted-foreground font-medium text-lg">إدارة بياناتك وأهدافك الصحية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-[2.5rem] p-6 sticky top-24">
            <nav className="space-y-2">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-right group
                      ${isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }
                    `}
                  >
                    <section.icon className={`h-5 w-5 transition-all ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`} />
                    <span className="font-bold">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
