import { Polar } from "@polar-sh/sdk";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

type PolarServer = "sandbox" | "production";

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function getPolarServer(): PolarServer {
  const raw = process.env.POLAR_SERVER;
  return raw === "production" ? "production" : "sandbox";
}

let polarSingleton: Polar | undefined;
export function getPolarClient(): Polar {
  if (polarSingleton) return polarSingleton;
  polarSingleton = new Polar({
    server: getPolarServer(),
    accessToken: getRequiredEnv("POLAR_ACCESS_TOKEN"),
  });
  return polarSingleton;
}

let meterIdCache: string | undefined;
async function getMeterIdByName(): Promise<string> {
  if (meterIdCache) return meterIdCache;
  const meterName = getRequiredEnv("POLAR_METER_NAME").trim();
  const polar = getPolarClient();

  const it = await polar.meters.list({
    query: meterName,
    limit: 100,
    page: 1,
  });

  for await (const page of it) {
    const found = page.result.items.find((m) => m.name === meterName) ?? page.result.items[0];
    if (found?.id) {
      meterIdCache = found.id;
      return found.id;
    }
    break;
  }

  throw new Error(`Polar meter not found: ${meterName}`);
}

export async function getCustomerCreditsBalance(customerId: string): Promise<number> {
  const polar = getPolarClient();
  const meterId = await getMeterIdByName();

  const it = await polar.customerMeters.list({
    customerId,
    meterId,
    limit: 1,
    page: 1,
  });

  for await (const page of it) {
    const meter = page.result.items[0];
    const balance = typeof meter?.balance === "number" ? meter.balance : 0;
    return balance;
  }

  return 0;
}

export async function ingestCreditDelta(args: {
  customerId: string;
  units: number; // negative grants credits, positive consumes
  externalId?: string;
  description?: string;
}) {
  const polar = getPolarClient();
  const eventName = getRequiredEnv("POLAR_METER_NAME").trim();

  const metadata: Record<string, string | number | boolean> = { units: args.units };
  if (args.description) metadata.description = args.description;

  await polar.events.ingest({
    events: [
      {
        name: eventName,
        customerId: args.customerId,
        externalId: args.externalId,
        metadata,
      },
    ],
  });
}

export async function getUserPolarCustomerId(userId: string): Promise<string | null> {
  const rows = await db.select({ polarCustomerId: user.polarCustomerId }).from(user).where(eq(user.id, userId));
  return rows[0]?.polarCustomerId ?? null;
}

export async function setUserPolarCustomerId(userId: string, customerId: string) {
  await db.update(user).set({ polarCustomerId: customerId }).where(eq(user.id, userId));
}

export async function linkUserToPolarCustomerByEmail(args: {
  email: string;
  customerId: string;
}): Promise<{ userId: string } | null> {
  const emailLower = args.email.trim().toLowerCase();
  if (!emailLower) return null;
  const rows = await db
    .select({ id: user.id, polarCustomerId: user.polarCustomerId })
    .from(user)
    .where(sql`lower(${user.email}) = ${emailLower}`);

  const found = rows[0];
  if (!found?.id) return null;

  if (!found.polarCustomerId) {
    await db.update(user).set({ polarCustomerId: args.customerId }).where(eq(user.id, found.id));
  }

  return { userId: found.id };
}

/** للتحقق من جاهزية الرصيد (بعد العودة من الشراء) */
export async function getCreditsStatusForUser(userId: string): Promise<{
  hasCredits: boolean;
  polarCustomerId: string | null;
  balance: number;
}> {
  const polarCustomerId = await getUserPolarCustomerId(userId);
  if (!polarCustomerId) {
    return { hasCredits: false, polarCustomerId: null, balance: 0 };
  }
  const balance = await getCustomerCreditsBalance(polarCustomerId);
  return {
    hasCredits: Number.isFinite(balance) && balance > 0,
    polarCustomerId,
    balance: Number.isFinite(balance) ? balance : 0,
  };
}

