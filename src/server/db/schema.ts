import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// =============================================================================
// Better Auth + ملف تعريف المستخدم (Intlaq)
// =============================================================================

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),

    polarCustomerId: text("polar_customer_id"),

    gender: text("gender"),
    age: integer("age"),
    height: integer("height"),
    weight: doublePrecision("weight"),
    activityLevel: text("activity_level"),
    goal: text("goal"),

    bmr: integer("bmr"),
    tdee: integer("tdee"),
    dailyCalorieTarget: integer("daily_calorie_target"),
    calorieTargetFormula: text("calorie_target_formula"),
    calorieTargetCalculatedAt: timestamp("calorie_target_calculated_at"),

    onboardingCompleted: boolean("onboarding_completed").default(false),
  },
  (t) => ({
    polarCustomerIdIdx: index("user_polar_customer_id_idx").on(t.polarCustomerId),
    emailIdx: index("user_email_idx").on(t.email),
  })
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => ({
    userIdIdx: index("session_user_id_idx").on(t.userId),
    expiresAtIdx: index("session_expires_at_idx").on(t.expiresAt),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => ({
    userIdIdx: index("account_user_id_idx").on(t.userId),
    providerAccountIdx: uniqueIndex("account_provider_account_idx").on(
      t.providerId,
      t.accountId
    ),
  })
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// =============================================================================
// السعرات والوجبات
// =============================================================================

export const calorieEntry = pgTable(
  "calorie_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    calories: integer("calories").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index("calorie_entry_user_date_idx").on(t.userId, t.date),
  })
);

export const meals = pgTable(
  "meals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    userInputs: jsonb("user_inputs").notNull(),
    aiAnalysis: jsonb("ai_analysis").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index("meals_user_created_at_idx").on(t.userId, t.createdAt),
  })
);

// =============================================================================
// المهام والجلسات الزمنية
// =============================================================================

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    isCompleted: boolean("is_completed").default(false),
    position: integer("position").default(0).notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    userIdIdx: index("tasks_user_id_idx").on(t.userId),
  })
);

/** حالة العادة في يوم معيّن (مكتمل / فشل / فارغ) */
export const habitCompletion = pgTable(
  "habit_completion",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    status: text("status").notNull(), // "completed" | "failed" | "pending"
  },
  (t) => ({
    taskDateIdx: uniqueIndex("habit_completion_task_date_idx").on(t.taskId, t.date),
  })
);

export const timeSessions = pgTable(
  "time_sessions",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    type: text("type").notNull().default("focus"), // "focus" | "break"
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => ({
    userIdIdx: index("time_sessions_user_id_idx").on(t.userId),
    taskIdIdx: index("time_sessions_task_id_idx").on(t.taskId),
  })
);

export const weightHistory = pgTable(
  "weight_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    weight: doublePrecision("weight").notNull(),
    date: text("date").notNull(), // "YYYY-MM-DD"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index("weight_history_user_date_idx").on(t.userId, t.date),
  })
);

// =============================================================================
// التمارين
// =============================================================================

export const workoutGroups = pgTable(
  "workout_groups",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    icon: text("icon").notNull().default("🏋️‍♂️"),
    days: jsonb("days").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("workout_groups_user_id_idx").on(t.userId),
  })
);

export const exercises = pgTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => workoutGroups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sets: integer("sets").notNull().default(3),
    reps: integer("reps").notNull().default(10),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    groupIdIdx: index("exercises_group_id_idx").on(t.groupId),
  })
);

export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    groupId: text("group_id").notNull().references(() => workoutGroups.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index("workout_logs_user_date_idx").on(t.userId, t.date),
  })
);

