I have analyzed the codebase and identified the issue with the dashboard protection.

**The Problem:**
The `OnboardingGuard` component, which wraps the dashboard, only restricts access if a user is **logged in** but has an incomplete profile. It currently **does not checks** if a user is logged out. This means unauthenticated users can access the dashboard freely, which matches your description of the dashboard being "open for everyone" (or "protect for over").

**The Solution:**
I will update `src/components/dashboard/onboarding-guard.tsx` to strictly enforce protection:

1. **Unauthenticated Users:** If no user session exists, the dashboard will be blurred/blocked, and the authentication modal (Login/Register) will be shown.
2. **Authenticated Users (Incomplete Profile):** If logged in but onboarding is not done, the dashboard remains blocked, and the Onboarding form is shown.
3. **Authenticated Users (Complete Profile):** Access is granted.

**Implementation Details:**

* Modify `src/components/dashboard/onboarding-guard.tsx`:

  * Add a check for `!session` (unauthenticated).

  * Update the blocking logic to trigger if either `!session` OR `isProfileIncomplete`.

  * Configure the `AuthModal` to show the correct view (Login vs. Onboarding) based on the user's status.

