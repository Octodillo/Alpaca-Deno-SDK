import { getCalendar, getClock } from "./calendar.ts";

export const tradingEndpoints = {
  clock: getClock,
  calendar: getCalendar,
};
