import assert from "node:assert/strict";
import test from "node:test";
import { courseProgressSchema, decideDeadlineAlert } from "../src/deadline_alert.js";

test("alerts an unfinished learner inside the 24-hour window", () => {
  const progress = courseProgressSchema.parse({
    course: { id: "algebra-1", title: "Algebra Foundations" },
    learner: { id: "learner-9", firstName: "Ravi", phone: "+14155550123" },
    deadline: "2026-09-10T08:00:00.000Z",
    completedPercent: 40,
    observedAt: "2026-09-09T14:30:00.000Z",
  });

  assert.deepEqual(decideDeadlineAlert(progress), {
    action: "send",
    to: "+14155550123",
    body: "Ravi, Algebra Foundations is due in 18h. You are 40% complete.",
    idempotencyKey: "deadline:algebra-1:learner-9:2026-09-10T08:00:00.000Z",
  });
});

test("does not alert a learner who finished the course", () => {
  const progress = courseProgressSchema.parse({
    course: { id: "algebra-1", title: "Algebra Foundations" },
    learner: { id: "learner-9", firstName: "Ravi", phone: "+14155550123" },
    deadline: "2026-09-10T08:00:00.000Z",
    completedPercent: 100,
    observedAt: "2026-09-09T14:30:00.000Z",
  });

  assert.deepEqual(decideDeadlineAlert(progress), { action: "skip", reason: "completed" });
});
