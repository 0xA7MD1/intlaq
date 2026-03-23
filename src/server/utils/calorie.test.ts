import { describe, expect, it } from "vitest";
import { calculateDailyCalories } from "./calorie";

describe("calculateDailyCalories", () => {
  it("calculates mifflin-st jeor male moderate maintain", () => {
    const result = calculateDailyCalories({
      sex: "male",
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: "moderate",
      goal: "maintain",
      formula: "mifflin",
    });

    expect(result.formula).toBe("mifflin");
    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2759);
    expect(result.dailyCalories).toBe(2759);
  });

  it("calculates mifflin-st jeor female light cut", () => {
    const result = calculateDailyCalories({
      sex: "female",
      age: 28,
      heightCm: 165,
      weightKg: 60,
      activityLevel: "light",
      goal: "cut",
      formula: "mifflin",
    });

    expect(result.bmr).toBe(1330);
    expect(result.tdee).toBe(1829);
    expect(result.dailyCalories).toBe(1555);
  });

  it("clamps daily calories to minimum thresholds", () => {
    const result = calculateDailyCalories({
      sex: "female",
      age: 99,
      heightCm: 140,
      weightKg: 35,
      activityLevel: "sedentary",
      goal: "cut",
      formula: "mifflin",
    });

    expect(result.dailyCalories).toBeGreaterThanOrEqual(1200);
  });

  it("supports revised harris-benedict", () => {
    const result = calculateDailyCalories({
      sex: "male",
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: "moderate",
      goal: "maintain",
      formula: "harris",
    });

    expect(result.formula).toBe("harris");
    expect(result.bmr).toBe(1854);
    expect(result.tdee).toBe(2873);
    expect(result.dailyCalories).toBe(2873);
  });
});
