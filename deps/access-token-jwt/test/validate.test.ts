import sinon = require('sinon');
import validate, { defaultValidators } from '../src/validate';

const header = {
  alg: 'RS256',
  typ: 'JWT',
};
const payload = {
  iss: 'https://issuer.example.com',
  aud: 'http://api.example.com',
  exp: ((Date.now() / 1000) | 0) + 60 * 60,
  iat: (Date.now() / 1000) | 0,
  sub: 'foo',
  client_id: 'bar',
  jti: 'baz',
};

const validators = ({
  issuer = 'https://issuer.example.com',
  audience = 'http://api.example.com',
  clockTolerance = 10,
  maxTokenAge = 10,
  strict = false,
  allowedSigningAlgs,
  tokenSigningAlg,
}: {
  issuer?: string;
  audience?: string | string[];
  clockTolerance?: number;
  maxTokenAge?: number;
  strict?: boolean;
  allowedSigningAlgs?: string[];
  tokenSigningAlg?: string;
} = {}) =>
  defaultValidators(
    issuer,
    audience,
    clockTolerance,
    maxTokenAge,
    strict,
    allowedSigningAlgs,
    tokenSigningAlg
  );

describe('validate', () => {
  it('should validate a jwt with default validators', async () => {
    await expect(
      validate(payload, header, validators())
    ).resolves.not.toThrow();
  });
  it('should throw for invalid alg header', async () => {
    await expect(
      validate(payload, { ...header, alg: 'none' }, validators())
    ).rejects.toThrow(`Unexpected 'alg' value`);
    await expect(
      validate(payload, { ...header, alg: 'None' }, validators())
    ).rejects.toThrow(`Unexpected 'alg' value`);
    await expect(
      validate(payload, { ...header, alg: 'NONE' }, validators())
    ).rejects.toThrow(`Unexpected 'alg' value`);
    await expect(
      validate(
        payload,
        { ...header, alg: 'RS256' },
        validators({ allowedSigningAlgs: ['HS256'] })
      )
    ).rejects.toThrow(`Unexpected 'alg' value`);
  });
  it('should disable alg header check', async () => {
    await expect(
      validate(
        payload,
        { ...header, alg: 'none' },
        { ...validators(), alg: false }
      )
    ).resolves.not.toThrow();
  });
  it('should throw for invalid typ in strict mode', async () => {
    await expect(
      validate(payload, header, validators({ strict: true }))
    ).rejects.toThrow(`Unexpected 'typ' value`);
    await expect(
      validate(
        payload,
        { ...header, typ: 1 as any },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'typ' value`);
  });
  it('should validate typ in strict mode', async () => {
    await expect(
      validate(
        payload,
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).resolves.not.toThrow();
    await expect(
      validate(
        payload,
        { ...header, typ: 'AT+JWT' },
        validators({ strict: true })
      )
    ).resolves.not.toThrow();
    await expect(
      validate(
        payload,
        { ...header, typ: 'application/at+jwt' },
        validators({ strict: true })
      )
    ).resolves.not.toThrow();
  });
  it('should throw for missing claims in strict mode', async () => {
    await expect(
      validate(
        { ...payload, sub: undefined },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'sub' value`);
    await expect(
      validate(
        { ...payload, client_id: undefined },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'client_id' value`);
    await expect(
      validate(
        { ...payload, jti: undefined },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'jti' value`);
  });
  it('should throw for invalid claims in strict mode', async () => {
    await expect(
      validate(
        { ...payload, sub: 1 as any },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'sub' value`);
    await expect(
      validate(
        { ...payload, client_id: ['bar'] },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'client_id' value`);
    await expect(
      validate(
        { ...payload, jti: true as any },
        { ...header, typ: 'at+jwt' },
        validators({ strict: true })
      )
    ).rejects.toThrow(`Unexpected 'jti' value`);
  });
  it('should throw for issuer mismatch', async () => {
    await expect(
      validate({ ...payload, iss: 'foo' }, header, validators())
    ).rejects.toThrow(`Unexpected 'iss' value`);
  });
  it('should throw for audience mismatch', async () => {
    await expect(
      validate(
        { ...payload, aud: 'foo' },
        header,
        validators({ audience: ['bar'] })
      )
    ).rejects.toThrow(`Unexpected 'aud' value`);
    await expect(
      validate(
        { ...payload, aud: ['bar'] },
        header,
        validators({ audience: ['foo'] })
      )
    ).rejects.toThrow(`Unexpected 'aud' value`);
    await expect(
      validate(
        { ...payload, aud: 1 as any },
        header,
        validators({ audience: 'foo' })
      )
    ).rejects.toThrow(`Unexpected 'aud' value`);
  });
  it('should validate aud claim', async () => {
    await expect(
      validate(
        { ...payload, aud: 'foo' },
        header,
        validators({ audience: ['foo'] })
      )
    ).resolves.not.toThrow();
    await expect(
      validate(
        { ...payload, aud: ['foo', 'bar'] },
        header,
        validators({ audience: ['foo', 'bar', 'baz'] })
      )
    ).resolves.not.toThrow();
    await expect(
      validate(
        { ...payload, aud: ['foo', 'bar', 'baz'] },
        header,
        validators({ audience: ['foo', 'bar'] })
      )
    ).resolves.not.toThrow();
  });
  it('should throw for invalid exp claim', async () => {
    const clock = sinon.useFakeTimers(100 * 1000);
    await expect(
      validate(
        { ...payload, exp: 50, iat: 0 },
        header,
        validators({ clockTolerance: 0, maxTokenAge: 100 })
      )
    ).rejects.toThrow(`Unexpected 'exp' value`);
    await expect(
      validate(
        { ...payload, exp: 'foo' as any, iat: 0 },
        header,
        validators({ clockTolerance: 0, maxTokenAge: 100 })
      )
    ).rejects.toThrow(`Unexpected 'exp' value`);
    clock.restore();
  });
  it('should validate exp claim with clockTolerance', async () => {
    const clock = sinon.useFakeTimers(100 * 1000);
    await expect(
      validate(
        { ...payload, exp: 50, iat: 0 },
        header,
        validators({ clockTolerance: 75, maxTokenAge: 100 })
      )
    ).resolves.not.toThrow();
    clock.restore();
  });
  it('should throw for invalid iat claim', async () => {
    const clock = sinon.useFakeTimers(100 * 1000);
    await expect(
      validate(
        { ...payload, iat: 0 },
        header,
        validators({ clockTolerance: 0, maxTokenAge: 90 })
      )
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate(
        { ...payload, iat: undefined },
        { ...header, typ: 'at+jwt' },
        validators({ maxTokenAge: 0, strict: true })
      )
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate({ ...payload, iat: 'foo' as any }, header, validators())
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate({ ...payload, iat: 200 }, header, validators())
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate({ ...payload, iat: 0 }, header, validators())
    ).rejects.toThrow(`Unexpected 'iat' value`);
    clock.restore();
  });
  it('should validate iat claim', async () => {
    const clock = sinon.useFakeTimers(100 * 1000);
    await expect(
      validate(
        { ...payload, iat: 200 },
        header,
        validators({ maxTokenAge: 100 })
      )
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate({ ...payload, iat: 0 }, header, validators({ maxTokenAge: 100 }))
    ).resolves.not.toThrow();
    await expect(
      validate(
        { ...payload, iat: 200 },
        header,
        validators({ clockTolerance: 100 })
      )
    ).rejects.toThrow(`Unexpected 'iat' value`);
    await expect(
      validate(
        { ...payload, iat: 0 },
        header,
        validators({ clockTolerance: 100 })
      )
    ).resolves.not.toThrow();
    clock.restore();
  });
  it('should validate with custom validators', async () => {
    await expect(
      validate({ ...payload, foo: 'bar' }, header, {
        ...validators(),
        foo: 'baz',
      })
    ).rejects.toThrow(`Unexpected 'foo' value`);
    await expect(
      validate({ ...payload, foo: 'bar' }, header, {
        ...validators(),
        foo: 'bar',
      })
    ).resolves.not.toThrow();
    await expect(
      validate({ ...payload, foo: 'bar' }, header, {
        ...validators(),
        foo: () => false,
      })
    ).rejects.toThrow(`Unexpected 'foo' value`);
    await expect(
      validate({ ...payload, foo: 'bar' }, header, {
        ...validators(),
        foo: () => Promise.resolve(true),
      })
    ).resolves.not.toThrow();
  });
});
