import { processEducatorReport } from "../src/course_alert_service.js";

const phone = process.env.DEMO_LEARNER_PHONE;
if (!phone) throw new Error("DEMO_LEARNER_PHONE is required");

const now = new Date();
const result = await processEducatorReport({
  educatorId: "educator-7",
  progress: {
    course: { id: "typescript-201", title: "Practical TypeScript" },
    learner: { id: "learner-42", firstName: "Mina", phone },
    deadline: new Date(now.getTime() + 18 * 3_600_000).toISOString(),
    completedPercent: 65,
    observedAt: now.toISOString(),
  },
});

console.log(result);
