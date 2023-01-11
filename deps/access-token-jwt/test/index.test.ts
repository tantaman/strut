import { randomBytes } from 'crypto';
import { Agent } from 'http';
import nock = require('nock');
import sinon = require('sinon');
import { createJwt } from './helpers';
import { jwtVerifier } from '../src';

describe('index', () => {
  afterEach(nock.cleanAll);

  it('gets metadata and verifies jwt with discovery', async () => {
    const jwt = await createJwt({ issuer: 'https://op.example.com' });

    const verify = jwtVerifier({
      issuerBaseURL: 'https://op.example.com',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).resolves.toHaveProperty('payload', {
      iss: 'https://op.example.com',
      sub: 'me',
      aud: 'https://api/',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('gets metadata and verifies jwt without discovery', async () => {
    const jwt = await createJwt({ issuer: 'https://op.example.com' });

    const verify = jwtVerifier({
      issuer: 'https://op.example.com',
      jwksUri: 'https://op.example.com/.well-known/jwks.json',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).resolves.toHaveProperty('payload', {
      iss: 'https://op.example.com',
      sub: 'me',
      aud: 'https://api/',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('verifies jwt signed with symmetric secret', async () => {
    const secret = randomBytes(32).toString('hex');
    const jwt = await createJwt({
      issuer: 'https://op.example.com',
      secret,
    });

    const verify = jwtVerifier({
      issuer: 'https://op.example.com',
      secret,
      tokenSigningAlg: 'HS256',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).resolves.toHaveProperty('payload', {
      iss: 'https://op.example.com',
      sub: 'me',
      aud: 'https://api/',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('caches discovery and jwks requests in memory', async () => {
    const discoverSpy = jest.fn();
    const jwksSpy = jest.fn();

    const jwt = await createJwt({
      issuer: 'https://op.example.com',
      jwksSpy,
      discoverSpy,
    });

    const verify = jwtVerifier({
      issuerBaseURL: 'https://op.example.com',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).resolves.toBeTruthy();
    await expect(verify(jwt)).resolves.toBeTruthy();
    await expect(verify(jwt)).resolves.toBeTruthy();
    expect(discoverSpy).toHaveBeenCalledTimes(1);
    expect(jwksSpy).toHaveBeenCalledTimes(1);
  });

  it('caches discovery in memory once', async () => {
    const discoverSpy = jest.fn();

    const jwt = await createJwt({
      issuer: 'https://op.example.com',
      discoverSpy,
    });

    const verify = jwtVerifier({
      issuerBaseURL: 'https://op.example.com',
      audience: 'https://api/',
    });
    await expect(
      Promise.all([verify(jwt), verify(jwt), verify(jwt)])
    ).resolves.toBeTruthy();
    expect(discoverSpy).toHaveBeenCalledTimes(1);
  });

  it('handles rotated signing keys', async () => {
    // @FIXME Use jest timers when facebook/jest#10221 is fixed
    const clock = sinon.useFakeTimers();
    const jwksSpy = jest.fn();
    const oldJwt = await createJwt({
      issuer: 'https://op.example.com',
      jwksSpy,
      kid: 'a',
    });

    const verify = jwtVerifier({
      issuer: 'https://op.example.com',
      jwksUri: 'https://op.example.com/.well-known/jwks.json',
      audience: 'https://api/',
      cooldownDuration: 1000,
    });
    await expect(verify(oldJwt)).resolves.toBeTruthy();

    nock.cleanAll();
    const newJwt = await createJwt({
      issuer: 'https://op.example.com',
      jwksSpy,
      kid: 'b',
    });
    clock.tick(1000);

    await expect(verify(newJwt)).resolves.toBeTruthy();
    clock.restore();
  });

  it('should accept custom http options', async () => {
    const jwt = await createJwt({
      issuer: 'https://op.example.com',
    });

    const verify = jwtVerifier({
      issuerBaseURL: 'https://op.example.com',
      audience: 'https://api/',
      agent: new Agent(),
      timeoutDuration: 1000,
    });
    const promise = verify(jwt);
    await expect(promise).resolves.toBeTruthy();
  });

  it('should accept custom validators', async () => {
    const jwt = await createJwt({
      issuer: 'https://op.example.com',
      payload: { foo: 'baz' },
    });

    const verify = jwtVerifier({
      issuerBaseURL: 'https://op.example.com',
      audience: 'https://api/',
      agent: new Agent(),
      timeoutDuration: 1000,
      validators: {
        foo: 'bar',
      },
    });
    const promise = verify(jwt);
    await expect(promise).rejects.toThrow(`Unexpected 'foo' value`);
  });
});
