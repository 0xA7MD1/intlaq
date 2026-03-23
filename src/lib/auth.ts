import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/index"; 

export const auth = betterAuth({
  // ✅ ربط Drizzle
  database: drizzleAdapter(db, {
    provider: "pg", 
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // (اختياري) يدخله مباشرة بعد التسجيل
  },

  // ✅ إعدادات جوجل
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  
  // ✅ الرابط الأساسي
  baseURL: process.env.baseURL,
  trustedOrigins: [
    process.env.baseURL ?? "http://localhost:3000",
    "http://localhost:3000",
    "https://intlaq.vercel.app",
  ]
});
