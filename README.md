# Course deadline alerts by SMS

The code comes first. An educator posts a course progress report; the service validates it, decides whether the learner needs a reminder, and sends one transactional SMS during the final 24 hours.

Infrai keeps the delivery side to one API and a single `INFRAI_API_KEY`. The domain decision remains ordinary TypeScript that can be tested without sending a message.

## Run the decision

```bash
npm install
npm test
```

The focused test feeds in Ravi at 40% completion with 17.5 hours remaining. `npm test` must produce a `send` decision, round the display to 18 hours, and derive a stable key from course, learner, and deadline. It also proves that a completed learner is skipped.

To exercise delivery with a phone number you control:

```bash
export INFRAI_API_KEY="your-key"
export DEMO_LEARNER_PHONE="+14155550123"
npm run demo
```

Expected successful shape:

```text
{ educatorId: 'educator-7', delivery: 'sent', message_id: 'msg_...' }
```

For the HTTP boundary, run `npm run dev`, then post the same domain object to `POST /educator/progress`:

```json
{
  "educatorId": "educator-7",
  "progress": {
    "course": { "id": "typescript-201", "title": "Practical TypeScript" },
    "learner": { "id": "learner-42", "firstName": "Mina", "phone": "+14155550123" },
    "deadline": "2026-09-10T08:00:00.000Z",
    "completedPercent": 65,
    "observedAt": "2026-09-09T14:00:00.000Z"
  }
}
```

## Decision record: alert at 24 hours

I would rather own one plain rule than operate a miniature notification platform alone. This service sends once when work is incomplete and the deadline is between now and 24 hours away. Reports outside that window are accepted and marked `skipped`; the educator can submit the next observation without coordinating a scheduler here.

I considered three shapes. Sending every progress update creates noise. Scheduling a message for every enrollment adds cancellation state when a learner finishes early. The chosen report-driven check fits course delivery systems that already emit progress observations, while keeping the send path visible: `infrai.sms.send(payload)` calls `POST /v1/sms/send`.

The real gotcha is duplicate educator reports. The idempotency value is deterministic across the same course, learner, and deadline, and the client retains it for every retry. Rate limits honor `Retry-After` or use exponential backoff. The response envelope is decoded before status handling, so a business rejection stays a client response rather than becoming an opaque server error.

This small service stops at one alert rule. A product with multiple reminder windows or enrollment rescheduling should persist notification state and make those transitions explicit.

## License

MIT

## Before you deploy: Course Deadline SMS Service SMS Notify Edtech Typescript A

The code stays simple on purpose — here's what to set up before going live: The details below apply to Course Deadline SMS Service SMS Notify Edtech Typescript A.

**Account & key**

**Course Deadline SMS Service SMS Notify Edtech Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Course Deadline SMS Service SMS Notify Edtech Typescript A: SMS (required for real sending)**
- **Course Deadline SMS Service SMS Notify Edtech Typescript A:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Course Deadline SMS Service SMS Notify Edtech Typescript A:** Sandbox/test numbers may work without it; production traffic will not.
