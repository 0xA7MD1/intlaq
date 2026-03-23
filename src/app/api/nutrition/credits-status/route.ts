import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCreditsStatusForUser } from "@/server/utils/polar";

/** للتحقق من رصيد المستخدم (مثلاً بعد العودة من شراء كريدت) */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getCreditsStatusForUser(session.user.id);
  return NextResponse.json(status);
}
