import { z } from "zod";

export const courseProgressSchema = z.object({
  course: z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
  }),
  learner: z.object({
    id: z.string().min(1),
    firstName: z.string().min(1).max(40),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  }),
  deadline: z.string().datetime(),
  completedPercent: z.number().int().min(0).max(100),
  observedAt: z.string().datetime(),
});

export type CourseProgress = z.infer<typeof courseProgressSchema>;

export type AlertDecision =
  | { action: "skip"; reason: "completed" | "outside_window" }
  | { action: "send"; to: string; body: string; idempotencyKey: string };

export function decideDeadlineAlert(progress: CourseProgress): AlertDecision {
  if (progress.completedPercent === 100) {
    return { action: "skip", reason: "completed" };
  }

  const hoursLeft =
    (Date.parse(progress.deadline) - Date.parse(progress.observedAt)) / 3_600_000;
  if (hoursLeft <= 0 || hoursLeft > 24) {
    return { action: "skip", reason: "outside_window" };
  }

  const roundedHours = Math.ceil(hoursLeft);
  return {
    action: "send",
    to: progress.learner.phone,
    body: `${progress.learner.firstName}, ${progress.course.title} is due in ${roundedHours}h. You are ${progress.completedPercent}% complete.`,
    idempotencyKey: `deadline:${progress.course.id}:${progress.learner.id}:${progress.deadline}`,
  };
}
