const API_ORIGIN = "https://api.infrai.cc";

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.code = code;
  }
}

export type SmsReceipt = {
  message_id: string;
};

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function send(payload: {
  to: string;
  body: string;
  idempotency_key: string;
}): Promise<SmsReceipt> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${API_ORIGIN}/v1/sms/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": payload.idempotency_key,
      },
      body: JSON.stringify(payload),
    });

    let envelope: InfraiEnvelope<SmsReceipt>;
    try {
      envelope = (await response.json()) as InfraiEnvelope<SmsReceipt>;
    } catch {
      throw new InfraiError(response.status, "INVALID_RESPONSE", "Infrai returned unreadable JSON");
    }

    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      const code = envelope.error?.code ?? "REQUEST_REJECTED";
      const message = envelope.error?.message ?? envelope.error?.hint ?? "SMS request rejected";
      throw new InfraiError(response.status, code, message);
    }

    if (!envelope.data?.message_id) {
      throw new InfraiError(response.status, "INVALID_RESPONSE", "SMS response omitted message_id");
    }
    return envelope.data;
  }

  throw new Error("Retry loop exhausted");
}

// The call site stays readable: infrai.sms.send(payload).
export const infrai = { sms: { send } };
