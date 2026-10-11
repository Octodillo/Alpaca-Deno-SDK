import { Z } from "../external.ts";
import { Endpoint } from "../client.ts";
import { CalendarDateType, CalendarQuerySchema, CalendarSchema, ClockSchema } from "./schemas.ts";

export const getCalendar = {
  name: "Get Market Calendar",
  api: "trading",
  method: "GET",
  path: "v2/calendar",

  query: CalendarQuerySchema,
  body: Z.never(),
  response: CalendarSchema,

  okStatus: 200,

  args: (start?: string, end?: string, date_type?: CalendarDateType) => ({ query: { start, end, date_type } }),
} satisfies Endpoint;

export const getClock = {
  name: "Get Market Clock",
  api: "trading",
  method: "GET",
  path: "v2/clock",

  query: Z.never(),
  body: Z.never(),
  response: ClockSchema,

  okStatus: 200,
} satisfies Endpoint;
