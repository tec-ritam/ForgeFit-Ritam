export interface Workout {
  id: string
  user_id: string
  date: string
  day_label: string | null
  muscle_group: string | null
  notes: string | null
  completed: boolean
}

export interface Exercise {
  id: string
  workout_id: string
  user_id: string
  name: string
  sets: number
  reps: number
  weight_kg: number
  rest_seconds: number
  completed: boolean
}

export interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  taken_at: string
  weight_kg: number | null
  note: string | null
}

export interface Achievement {
  id: string
  user_id: string
  key: string
  title: string
  unlocked_at: string
}

export const WEEK_SPLIT: { day: string; muscle: string; exercises: { name: string; sets: number; reps: number }[] }[] = [
  { day: 'Monday', muscle: 'Chest & Triceps', exercises: [
    { name: 'Barbell Bench Press', sets: 4, reps: 8 }, { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
    { name: 'Cable Fly', sets: 3, reps: 12 }, { name: 'Tricep Pushdown', sets: 3, reps: 12 }, { name: 'Overhead Tricep Extension', sets: 3, reps: 10 },
  ]},
  { day: 'Tuesday', muscle: 'Back & Biceps', exercises: [
    { name: 'Deadlift', sets: 4, reps: 6 }, { name: 'Pull-Up', sets: 3, reps: 8 },
    { name: 'Barbell Row', sets: 3, reps: 10 }, { name: 'Lat Pulldown', sets: 3, reps: 12 }, { name: 'Barbell Curl', sets: 3, reps: 10 },
  ]},
  { day: 'Wednesday', muscle: 'Legs', exercises: [
    { name: 'Back Squat', sets: 4, reps: 8 }, { name: 'Romanian Deadlift', sets: 3, reps: 10 },
    { name: 'Leg Press', sets: 3, reps: 12 }, { name: 'Walking Lunge', sets: 3, reps: 12 }, { name: 'Calf Raise', sets: 4, reps: 15 },
  ]},
  { day: 'Thursday', muscle: 'Shoulders', exercises: [
    { name: 'Overhead Press', sets: 4, reps: 8 }, { name: 'Lateral Raise', sets: 3, reps: 12 },
    { name: 'Face Pull', sets: 3, reps: 15 }, { name: 'Rear Delt Fly', sets: 3, reps: 12 }, { name: 'Shrug', sets: 3, reps: 15 },
  ]},
  { day: 'Friday', muscle: 'Arms', exercises: [
    { name: 'Close-Grip Bench', sets: 3, reps: 10 }, { name: 'Skull Crusher', sets: 3, reps: 12 },
    { name: 'Hammer Curl', sets: 3, reps: 10 }, { name: 'Cable Curl', sets: 3, reps: 12 }, { name: 'Dip', sets: 3, reps: 10 },
  ]},
  { day: 'Saturday', muscle: 'Core & Cardio', exercises: [
    { name: 'Hanging Leg Raise', sets: 3, reps: 12 }, { name: 'Plank', sets: 3, reps: 45 },
    { name: 'Cable Crunch', sets: 3, reps: 15 }, { name: 'Russian Twist', sets: 3, reps: 20 }, { name: 'HIIT Bike', sets: 5, reps: 60 },
  ]},
  { day: 'Sunday', muscle: 'Rest Day', exercises: [] },
]

export const ACHIEVEMENT_DEFS = [
  { key: 'streak_7', title: '7-Day Streak', emoji: '\u{1F3C6}', desc: '7 days in a row' },
  { key: 'streak_30', title: '30-Day Discipline', emoji: '\u{1F525}', desc: '30 days of consistency' },
  { key: 'first_pr', title: 'New Personal Record', emoji: '\u{1F4AA}', desc: 'Beat your best lift' },
  { key: 'workout_done', title: 'Workout Completed', emoji: '\u26A1', desc: 'Finished a full session' },
  { key: 'weekly_goal', title: 'Weekly Goal Achieved', emoji: '\u{1F3AF}', desc: 'Hit your weekly target' },
  { key: 'first_photo', title: 'First Photo', emoji: '\u{1F4F8}', desc: 'Logged your first progress photo' },
]

export function bmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function dayName(dateISO: string): string {
  return new Date(dateISO + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}
