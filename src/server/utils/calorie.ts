export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "maintain" | "cut" | "bulk";

export type CalorieFormula = "mifflin" | "harris";

export type CalorieCalculationInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  formula: CalorieFormula;
};

export type CalorieCalculationResult = {
  formula: CalorieFormula;
  bmr: number;
  tdee: number;
  dailyCalories: number;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_MULTIPLIERS: Record<Goal, number> = {
  maintain: 1,
  cut: 0.85,
  bulk: 1.1,
};

function roundInt(value: number) {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mifflinStJeorBmr(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === "male" ? base + 5 : base - 161;
}

function revisedHarrisBenedictBmr(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
}) {
  if (input.sex === "male") {
    return (
      88.362 + 13.397 * input.weightKg + 4.799 * input.heightCm - 5.677 * input.age
    );
  }

  return (
    447.593 + 9.247 * input.weightKg + 3.098 * input.heightCm - 4.33 * input.age
  );
}

export function calculateDailyCalories(
  input: CalorieCalculationInput
): CalorieCalculationResult {
  const bmrRaw =
    input.formula === "mifflin"
      ? mifflinStJeorBmr(input)
      : revisedHarrisBenedictBmr(input);

  const bmr = roundInt(bmrRaw);
  const tdee = roundInt(bmrRaw * ACTIVITY_MULTIPLIERS[input.activityLevel]);
  const rawDaily = tdee * GOAL_MULTIPLIERS[input.goal];

  const minDaily = input.sex === "male" ? 1500 : 1200;
  const dailyCalories = roundInt(clamp(rawDaily, minDaily, 5000));

  return {
    formula: input.formula,
    bmr,
    tdee,
    dailyCalories,
  };
}

