// What the generator and overrides must get right, checked on the generated schemas themselves.
import { assert } from "@std/assert";
import * as trading from "../src/generated/trading/endpoints.ts";
import * as broker from "../src/generated/broker/endpoints.ts";

Deno.test("generated: date filters documented as YYYY-MM-DD accept plain dates and date-times", () => {
  const queries = [
    trading.getAccountActivities.query,
    trading.getAccountActivitiesByActivityType.query,
    broker.getAccountActivities.query,
    broker.getAccountActivitiesByType.query,
  ];
  for (const query of queries) {
    for (const key of ["date", "after", "until"]) {
      assert(query.safeParse({ [key]: "2026-10-09" }).success, `${key} rejects a plain date`);
      assert(query.safeParse({ [key]: "2026-10-09T13:30:00Z" }).success, `${key} rejects a date-time`);
      assert(!query.safeParse({ [key]: "last tuesday" }).success, `${key} accepts anything`);
    }
  }
});
