import { URL } from 'url';
import { Agent as HttpAgent, get as getHttp } from 'http';
import { Agent as HttpsAgent, get as getHttps } from 'https';
import { once } from 'events';
import type { ClientRequest, IncomingMessage } from 'http';
import { TextDecoder } from 'util';

const decoder = new TextDecoder();

const concat = (...buffers: Uint8Array[]): Uint8Array => {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  buffers.forEach((buffer) => {
    buf.set(buffer, i);
    i += buffer.length;
  });
  return buf;
};

const protocols: {
  [protocol: string]: (...args: Parameters<typeof getHttps>) => ClientRequest;
} = {
  'https:': getHttps,
  'http:': getHttp,
};

export interface FetchOptions {
  agent?: HttpAgent | HttpsAgent;
  timeoutDuration?: number;
}

const fetch = async <TResponse>(
  url: URL,
  { agent, timeoutDuration: timeout }: FetchOptions
): Promise<TResponse> => {
  const req = protocols[url.protocol](url.href, {
    agent,
    timeout,
  });

  const [response] = <[IncomingMessage]>await once(req, 'response');

  if (response.statusCode !== 200) {
    throw new Error(
      `Failed to fetch ${url.href}, responded with ${response.statusCode}`
    );
  }

  const parts = [];
  for await (const part of response) {
    parts.push(part);
  }

  try {
    return JSON.parse(decoder.decode(concat(...parts)));
  } catch (err) {
    throw new Error(`Failed to parse the response from ${url.href}`);
  }
};

export default fetch;
