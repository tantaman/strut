import { math } from "@strut/utils";
const { floor } = math;
export const INTERVAL = 5000;

/*
Counter service that batches events and send them somewhere....
Can count based on a key.
Aggregate based on...
sum, avg, min, max, ... pX?

We need to count persist operations to undertand:
1. How often we persist
2. What event is causing the persist
*/
export type AGG = "sum" | "avg" | "min" | "max";
export type Measurement = {
  value: number;
  time: number;
};

type MeasurementNode = Measurement & {
  next?: MeasurementNode;
};

const pendingMeasurements = new Map<string, MeasurementList>();
// Aggregations. collections of numbers by key over time in 5 second snapshots
export const aggregatedMeasurements = new Map<string, Measurement[]>();

const subscribers: ((batch: Map<string, Measurement[]>) => void)[] = [];
export function subscribe(
  cb: (batch: Map<string, Measurement[]>) => void
): () => void {
  subscribers.push(cb);
  return () => {
    const i = subscribers.indexOf(cb);
    subscribers.splice(i, 1);
  };
}

function notifySubscribers(batch: Map<string, Measurement[]>) {
  for (const s of subscribers) {
    s(batch);
  }
}

function makeKey(namespace: string, key: string, agg: AGG) {
  return namespace + ":" + key + ":" + agg;
}

let lastTime = floor(Date.now(), INTERVAL);
/**
 * Every INTERVAL, consume all points within a exact time-clamped buckets
 * of INTERVAL
 */
setInterval(() => {
  const currentTime = floor(Date.now(), INTERVAL);
  if (currentTime - lastTime < INTERVAL) {
    return;
  }
  lastTime = currentTime;
  const currentBatch: Map<string, Measurement[]> = new Map();
  for (let [key, value] of pendingMeasurements.entries()) {
    currentBatch.set(key, aggregate(key, value, currentTime));
  }
  notifySubscribers(currentBatch);
}, INTERVAL);

function aggregate(
  key: string,
  unaggregated: MeasurementList,
  bound: number
): Measurement[] {
  const currentBatch: Measurement[] = [];
  let aggregation = aggregatedMeasurements.get(key);
  if (aggregation == null) {
    aggregation = [];
    aggregatedMeasurements.set(key, aggregation);
  }

  let front: Measurement | undefined;
  let accumulatorStart: number | undefined;
  let accumulator = 0;
  let numAccumulations = 0;
  do {
    front = unaggregated.front();
    if (!front) {
      // We have unaccumulated values to push
      if (accumulatorStart != null) {
        const measurement = {
          value: accumulator,
          time: floor(accumulatorStart, INTERVAL),
        };
        aggregation.push(measurement);
        currentBatch.push(measurement);
      }
      break;
    }

    // We've exceeded the boundary over which to accumulate.
    // Get this value on the next tick through
    if (front.time > bound) {
      break;
    }

    // The time of front is ok and front will be processed.
    // Go ahead and remove front.
    unaggregated.dequeue();

    // Have not started accumulating. Set our time over which to start accumulation.
    if (accumulatorStart == null) {
      accumulatorStart = front.time;
    }

    // We've hit a node past the allowed interval
    // push our accumulated results
    if (front.time - accumulatorStart >= INTERVAL) {
      const measurement = {
        value: accumulator,
        time: floor(accumulatorStart, INTERVAL),
      };
      aggregation.push(measurement);
      currentBatch.push(measurement);
      accumulator = 0;
      numAccumulations = 0;
      accumulatorStart = front.time;
    }

    // Default case -- add to the accumulator
    // Need different accumulator classes to handle correct accumulation
    accumulator += front.value;
    numAccumulations += 1;
  } while (front != null);

  return currentBatch;
}

class Counter {
  constructor(private namespace: string) {}

  bump(key: string, value: number = 1, agg: AGG = "sum"): this {
    const queueKey = makeKey(this.namespace, key, agg);
    let buckets = pendingMeasurements.get(queueKey);
    if (!buckets) {
      buckets = new MeasurementList();
      pendingMeasurements.set(queueKey, buckets);
    }
    buckets.enqueue(value);
    return this;
  }
}

export default function counter(namespace: string) {
  return new Counter(namespace);
}

class MeasurementList {
  first?: MeasurementNode;
  last?: MeasurementNode;

  // Currently only supporting sum
  constructor(public agg: AGG = "sum") {}

  enqueue(value: number) {
    const b = { value, time: Date.now() };
    if (this.last) {
      this.last.next = b;
      this.last = b;
      return;
    }
    this.first = this.last = b;
  }

  dequeue(): Measurement | undefined {
    const ret = this.first;
    this.first = this.first?.next;
    if (ret == this.last) {
      this.last = this.first;
    }
    return ret;
  }

  front(): Measurement | undefined {
    return this.first;
  }
}
