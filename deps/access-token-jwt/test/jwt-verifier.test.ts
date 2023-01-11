import { randomBytes } from 'crypto';
import nock = require('nock');
import { createJwt, now } from './helpers';
import { jwtVerifier, InvalidTokenError } from '../src';

describe('jwt-verifier', () => {
  afterEach(nock.cleanAll);

  it('should throw when configured with no jwksUri or issuerBaseURL and issuer', async () => {
    expect(() =>
      jwtVerifier({
        audience: 'https://api/',
      })
    ).toThrowError(
      "You must provide an 'issuerBaseURL', an 'issuer' and 'jwksUri' or an 'issuer' and 'secret'"
    );
  });

  it('should throw when configured with no audience', async () => {
    expect(() =>
      jwtVerifier({
        jwksUri: 'https://issuer.example.com/.well-known/jwks.json',
        issuer: 'https://issuer.example.com/',
      })
    ).toThrowError("An 'audience' is required to validate the 'aud' claim");
  });

  it('should throw when configured with secret and no token signing alg', async () => {
    expect(() =>
      jwtVerifier({
        issuer: 'https://issuer.example.com/',
        audience: 'https://api/',
        secret: randomBytes(32).toString('hex'),
      })
    ).toThrowError(
      "You must provide a 'tokenSigningAlg' for validating symmetric algorithms"
    );
  });

  it('should throw when configured with secret and invalid token signing alg', async () => {
    expect(() =>
      jwtVerifier({
        issuer: 'https://issuer.example.com/',
        audience: 'https://api/',
        secret: randomBytes(32).toString('hex'),
        tokenSigningAlg: 'none',
      })
    ).toThrowError(
      "You must supply one of HS256, HS384, HS512 for 'tokenSigningAlg' to validate symmetrically signed tokens"
    );
  });

  it('should throw when configured with JWKS uri and invalid token signing alg', async () => {
    expect(() =>
      jwtVerifier({
        jwksUri: 'https://issuer.example.com/.well-known/jwks.json',
        issuer: 'https://issuer.example.com/',
        audience: 'https://api/',
        tokenSigningAlg: 'none',
      })
    ).toThrowError(
      "You must supply one of RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES256K, ES384, ES512, EdDSA for 'tokenSigningAlg' to validate asymmetrically signed tokens"
    );
  });

  it('should verify the token', async () => {
    const jwt = await createJwt();

    const verify = jwtVerifier({
      jwksUri: 'https://issuer.example.com/.well-known/jwks.json',
      issuer: 'https://issuer.example.com/',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).resolves.toHaveProperty('payload', {
      iss: 'https://issuer.example.com/',
      sub: 'me',
      aud: 'https://api/',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('should throw for unexpected issuer', async () => {
    const jwt = await createJwt({
      issuer: 'https://issuer1.example.com/',
    });

    const verify = jwtVerifier({
      jwksUri: 'https://issuer1.example.com/.well-known/jwks.json',
      issuer: 'https://issuer2.example.com/',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).rejects.toThrowError(`Unexpected 'iss' value`);
  });

  it('should throw for unexpected audience', async () => {
    const jwt = await createJwt({
      audience: 'https://api1/',
    });

    const verify = jwtVerifier({
      jwksUri: 'https://issuer.example.com/.well-known/jwks.json',
      issuer: 'https://issuer.example.com/',
      audience: 'https://api2/',
    });
    await expect(verify(jwt)).rejects.toThrowError(`Unexpected 'aud' value`);
  });

  it('should throw for an expired token', async () => {
    const jwt = await createJwt({
      exp: now - 10,
    });

    const verify = jwtVerifier({
      jwksUri: 'https://issuer.example.com/.well-known/jwks.json',
      issuer: 'https://issuer.example.com/',
      audience: 'https://api/',
    });
    await expect(verify(jwt)).rejects.toThrowError(
      '"exp" claim timestamp check failed'
    );
  });

  it('should throw unexpected token signing alg', async () => {
    const secret = randomBytes(32).toString('hex');
    const jwt = await createJwt({ secret });

    const verify = jwtVerifier({
      secret,
      issuer: 'https://issuer.example.com/',
      audience: 'https://api/',
      tokenSigningAlg: 'HS384',
    });
    await expect(verify(jwt)).rejects.toThrowError("Unexpected 'alg' value");
  });

  it('should fail with invalid_token error', async () => {
    const jwt = await createJwt({
      issuer: 'https://issuer.example.com',
    });
    const verify = jwtVerifier({
      issuerBaseURL:
        'https://issuer.example.com/.well-known/openid-configuration',
      audience: 'https://api/',
    });
    await expect(verify(`CORRUPT-${jwt}`)).rejects.toThrow(InvalidTokenError);
  });
});
