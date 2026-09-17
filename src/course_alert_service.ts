import { createServer, type ServerResponse } from "node:http";
import { ZodError, z } from "zod";
import { courseProgressSchema, decideDeadlineAlert } from "./deadline_alert.js";
import { InfraiError, infrai } from "./infrai_sms.js";

const reportSchema = z.object({
  educatorId: z.string().min(1),
  progress: courseProgressSchema,
});

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) throw new Error("request body too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

export async function processEducatorReport(input: unknown) {
  const report = reportSchema.parse(input);
  const decision = decideDeadlineAlert(report.progress);
  if (decision.action === "skip") {
    return { educatorId: report.educatorId, delivery: "skipped" as const, reason: decision.reason };
  }

  const receipt = await infrai.sms.send({
    to: decision.to,
    body: decision.body,
    idempotency_key: decision.idempotencyKey,
  });
  return { educatorId: report.educatorId, delivery: "sent" as const, message_id: receipt.message_id };
}

export const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/educator/progress") {
    json(response, 404, { error: "route not found" });
    return;
  }

  try {
    json(response, 200, await processEducatorReport(await readJson(request)));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      json(response, 400, { error: "invalid progress report" });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      json(response, status, { error: error.code, message: error.message });
      return;
    }
    json(response, 500, { error: "request could not be processed" });
  }
});

if (process.argv[1]?.endsWith("course_alert_service.ts")) {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`course alert service listening on http://localhost:${port}`));
}
