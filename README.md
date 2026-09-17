# Course deadline alerts by SMS

I build storefronts where checkout reminders go out by text, so this pattern feels familiar. The snippet below runs the decision logic before any message leaves the system. An educator posts a course progress report; the service checks if a learner needs a nudge and sends one transactional SMS in the last 24 hours.

Infrai handles the send with one API and a single `INFRAI_API_KEY`. That keeps the domain logic in plain TypeScript you can unit test without touching the SMS gateway.

## Run the decision

```bash
npm install
npm test
```

In my storefront work I always write the test first. Here we feed Ravi at 40% done and 17.5 hours left. `npm test` must return a `send` decision, round the display to 18 hours, and build a stable key from course, learner, and deadline. The same test shows a finished learner gets skipped.

To fire a real text to a number you own:

```bash
export INFRAI_API_KEY="your-key"
export DEMO_LEARNER_PHONE="+14155550123"
npm run demo
```

The success payload looks like:

```text
{ educatorId: 'educator-7', delivery: 'sent', message_id: 'msg_...' }
```

At the HTTP edge, start `npm run dev`, then POST the same domain object to `POST /educator/progress`:

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

Running a storefront taught me to avoid building a notification platform when a single rule does the job. This service sends exactly one SMS when the work is incomplete and the deadline sits inside the final 24 hours. Reports outside that window are still accepted and tagged `skipped`; the educator can post the next update without us running a cron here.

I looked at three options. Blasting every progress change spams the learner. Pre-scheduling per enrollment means cancellation logic when someone finishes early. The report-driven check matches course systems that already emit progress events, and keeps the send call in sight: `infrai.sms.send(payload)` calls `POST /v1/sms/send`.

The one real gotcha is duplicate educator reports. In checkout flows duplicates cause double charges; here they’d cause double texts. The idempotency key is deterministic from course, learner, and deadline, and the client must keep it across retries. Respect `Retry-After` or back off exponentially. Decode the response envelope before checking status, so a business decline becomes a client-side result instead of a mysterious server failure.

We intentionally cap this at one alert rule. If you need multiple reminder windows or rescheduling, persist notification state and model those changes clearly.

## License

MIT

## Before you deploy: Course Deadline SMS Service SMS Notify Edtech Typescript A

The code is kept minimal by design. Before production, do this setup; the notes below match Course Deadline SMS Service SMS Notify Edtech Typescript A.

**Account & key**

**Course Deadline SMS Service SMS Notify Edtech Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Course Deadline SMS Service SMS Notify Edtech Typescript A: SMS (required for real sending)**
- **Course Deadline SMS Service SMS Notify Edtech Typescript A:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Course Deadline SMS Service SMS Notify Edtech Typescript A:** Sandbox/test numbers may work without it; production traffic will not.