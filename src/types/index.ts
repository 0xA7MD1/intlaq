export type UserData = {
  id: string;
  name: string;
  email: string;
  image?: string;
  gender?: "male" | "female";
  age?: number;
  weight?: number; // تخزن كـ number في الداتابيس
  height?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal?: "maintain" | "cut" | "bulk";
  onboardingCompleted?: boolean;

  bmr?: number;
  tdee?: number;
  dailyCalorieTarget?: number;
  calorieTargetFormula?: "mifflin" | "harris";
  calorieTargetCalculatedAt?: string;
};

// google studio types
export type Habit = {
  id: string;
  name: string;
  completed: boolean;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
};

export type Exercise = {
  id: string;
  name: string;
  reps: string;
};

export type WeightEntry = {
  day: string;
  weight: number;
};

export type DashboardState = {
  habits: Habit[];
  meals: Meal[];
  exercises: Exercise[];
  weightHistory: WeightEntry[];
  timerSeconds: number;
  isTimerRunning: boolean;
  activeView:
    | "dashboard"
    | "projects"
    | "settings"
    | "planner"
    | "habits"
    | "focus"
    | "activity"
    | "nutrition";
  isAuthOpen: boolean;
  authType: "signin" | "signup";
};

export type NutritionAnalysis = {
  summary: string;
  total_nutrition: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  breakdown: Array<{
    item_name: string;
    estimated_amount: string;
    calories: number;
  }>;
  confidence_score: number;
  error?: string;
};

export type DietPlan = {
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  explanation: string;
};

export type DietInput = {
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  activity_level: string;
  goal: string;
};
