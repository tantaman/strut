jest.useFakeTimers();

let now = 0;

const dateNowStub = jest.fn(() => now);
global.Date.now = dateNowStub;

import counter, { aggregatedMeasurements, makeKey, INTERVAL } from "../counter";

it("evenly buckets when timer fires on bounds", () => {
  const c = counter("test");
  c.bump("a", 1);
  c.bump("a", 1);
  c.bump("a", 1);
  c.bump("a", 1);

  now += INTERVAL;
  jest.advanceTimersByTime(INTERVAL);

  let measures = aggregatedMeasurements.get(makeKey("test", "a", "sum"));
  if (measures == null) {
    throw new Error("No measures recorded");
  }

  expect(measures[0].time % INTERVAL).toEqual(0);
  expect(measures.length).toEqual(1);
  expect(measures[0].value).toEqual(4);
});

it("correctly buckets if the timer fires early then late", () => {
  const c = counter("test2");

  now += INTERVAL - INTERVAL / 2;
  c.bump("a", 1);
  c.bump("a", 1);
  c.bump("a", 1);

  jest.advanceTimersByTime(INTERVAL / 2);

  let measures = aggregatedMeasurements.get(makeKey("test2", "a", "sum"));
  expect(measures).toBe(undefined);

  now += INTERVAL;
  jest.advanceTimersByTime(INTERVAL);

  measures = aggregatedMeasurements.get(makeKey("test2", "a", "sum"));
  if (measures == null) {
    throw new Error("no measures recorded");
  }

  expect(measures[0].time % INTERVAL).toEqual(0);
  expect(measures.length).toEqual(1);
  expect(measures[0].value).toEqual(3);
});

it("correctly buckets when values are recorded in many buckets before the timer fires", () => {
  const c = counter("test3");

  now += INTERVAL;
  c.bump("a", 1);

  now += INTERVAL;
  c.bump("a", 1);
  now += INTERVAL / 2;
  c.bump("a", 1);

  now += INTERVAL;
  c.bump("a", 1);

  jest.advanceTimersByTime(INTERVAL);

  let measures = aggregatedMeasurements.get(makeKey("test3", "a", "sum"));
  if (measures == null) {
    throw new Error("no measures recorded");
  }

  expect(measures.length).toEqual(3);
  expect(measures[0].value).toBe(1);
  expect(measures[1].value).toBe(2);
  expect(measures[2].value).toBe(1);
});
