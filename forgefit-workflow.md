# ForgeFit Project Workflow

ForgeFit is a modern, responsive web application designed to help users track their workouts, monitor their progress, and achieve their fitness goals. Below is the complete user workflow and architecture of the application.

## 1. Landing & Authentication
* **Landing Page:** Users arrive at the homepage, which features a modern, animated UI showcasing the application's capabilities (Workout Tracking, AI Analytics, Progress Photos).
* **Sign Up / Log In:** Users can authenticate using an Email/Password combination or via Google OAuth. The authentication flow is securely managed by Supabase Auth.
* **Email Verification:** By default, new users receive a confirmation email to verify their identity before they can log in.

## 2. Onboarding & Profile Management
* **Profile Setup:** Upon logging in, users can navigate to the Profile section to enter their physical metrics (Height, Weight, Age) and set their fitness goals (e.g., Lose Weight, Build Muscle).
* **Profile Photo:** Users can click on their avatar to upload a custom profile picture, which is securely stored in a Supabase Storage bucket.
* **BMI Calculation:** The system automatically calculates and displays the user's Body Mass Index (BMI) based on their profile data.

## 3. The Dashboard (Central Hub)
* **Daily Overview:** The dashboard acts as the primary interface. It welcomes the user, displays their current streak, and outlines the workout scheduled for the day.
* **Weekly Summary:** A progress bar chart shows how many workouts the user has completed over the last 7 days.
* **Achievements Preview:** A gamified section displays recently unlocked fitness milestones to keep the user motivated.

## 4. Workout Planner (Default & Custom)
* **Default Plan (Bro Split):** Out of the box, the app provides a structured 7-day routine (Chest & Triceps, Back & Biceps, Legs, Shoulders, Arms, Core, Rest).
* **Custom Planner:** Users who want more control can toggle to the "Custom Plan". Here, they can:
  * Rename the focus of any day (e.g., "Push Day").
  * Add custom exercises by typing the exercise name.
  * Save these templates so they automatically recur each week.

## 5. Active Workout Tracking
* **Logging:** Within the Dashboard or Planner, users can start their daily workout. They check off exercises as they complete them.
* **Metrics:** For each exercise, users can adjust the number of Sets, Reps, and Weight (kg) used.
* **Rest Timer:** A built-in, floating rest timer allows users to time their recovery between sets precisely.
* **Completion:** Once all exercises are checked off, the workout is marked as complete, and the user's streak and weekly stats are updated.

## 6. Progress Tracking & Photos
* **Photo Journal:** Users can upload progress photos along with their current weight and notes. These are displayed in a visual timeline.
* **Analytics Dashboard:** A dedicated analytics page plots the user's weight changes and workout completion rates on interactive charts over time.

## 7. AI Analysis (Prototype Mode)
* **Feedback:** An integrated AI analysis tool reads the user's workout data and provides personalized recommendations (e.g., suggesting more volume for lagging body parts or advising on recovery).
* *Note: This feature is currently operating in a prototype/mock mode for demonstration purposes.*

---

## Technical Stack Summary
* **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Framer Motion (for animations).
* **Routing:** React Router v7 with Code-Splitting (`React.lazy`) for performance.
* **Backend:** Supabase (PostgreSQL Database, Row Level Security, Storage, Authentication).
* **Hosting:** Optimized for Netlify (SPA routing configured).
