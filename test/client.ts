import { loadSync } from "../src/external.ts";
import { Alpaca, AlpacaAuth } from "../src/client.ts";
import { getCalendar, getClock } from "../src/trading/calendar.ts";

const client = new Alpaca({ auth: loadSync() as unknown as AlpacaAuth });

Deno.test("request: clock", async () => {
  const clock = await client.request(getClock);
  console.log(clock.is_open, clock.next_open);
});

Deno.test("bind: calendar", async () => {
  const { bind } = client; // destructured on purpose: checks `this` survives
  const calendar = bind(getCalendar);
  const days = await calendar("2026-01-01", "2026-01-10");
  console.log(days.length, days[0]);
});
