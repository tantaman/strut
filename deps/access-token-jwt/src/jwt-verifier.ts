import { strict as assert } from 'assert';
import { Buffer } from 'buffer';
import { createSecretKey } from 'crypto';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { URL } from 'url';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload, JWSHeaderParameters } from 'jose'
import { InvalidTokenError } from 'oauth2-bearer';
import discover, { IssuerMetadata } from './discovery';
import validate, { defaultValidators, Validators } from './validate';

export interface JwtVerifierOptions {
  /**
   * Base url, used to find the authorization server's app metadata per
   * https://datatracker.ietf.org/doc/html/rfc8414
   * You can pass a full url including `.well-known` if your discovery lives at
   * a non standard path.
   * REQUIRED (if you don't include {@Link AuthOptions.jwksUri} and
   * {@Link AuthOptions.issuer})
   * You can also provide the `ISSUER_BASE_URL` environment variable.
   */
  issuerBaseURL?: string;

  /**
   * Expected JWT "aud" (Audience) Claim value(s).
   * REQUIRED: You can also provide the `AUDIENCE` environment variable.
   */
  audience?: string | string[];

  /**
   * Expected JWT "iss" (Issuer) Claim value.
   * REQUIRED (if you don't include {@Link AuthOptions.issuerBaseURL})
   * You can also provide the `ISSUER` environment variable.
   */
  issuer?: string;

  /**
   * Url for the authorization server's JWKS to find the public key to verify
   * an Access Token JWT signed with an asymmetric algorithm.
   * REQUIRED (if you don't include {@Link AuthOptions.issuerBaseURL})
   * You can also provide the `JWKS_URI` environment variable.
   */
  jwksUri?: string;

  /**
   * An instance of http.Agent or https.Agent to pass to the http.get or
   * https.get method options. Use when behind an http(s) proxy.
   */
  agent?: HttpAgent | HttpsAgent;

  /**
   * Duration in ms for which no more HTTP requests to the JWKS Uri endpoint
   * will be triggered after a previous successful fetch.
   * Default is 30000.
   */
  cooldownDuration?: number;

  /**
   * Timeout in ms for the HTTP request. When reached the request will be
   * aborted.
   * Default is 5000.
   */
  timeoutDuration?: number;

  /**
   * Pass in custom validators to override the existing validation behavior on
   * standard claims or add new validation behavior on custom claims.
   *
   * ```js
   *  {
   *    validators: {
   *      // Disable issuer validation by passing `false`
   *      iss: false,
   *      // Add validation for a custom claim to equal a passed in string
   *      org_id: 'my_org_123'
   *      // Add validation for a custom claim, by passing in a function that
   *      // accepts:
   *      // roles: the value of the claim
   *      // claims: an object containing the JWTPayload
   *      // header: an object representing the JWTHeader
   *      roles: (roles, claims, header) => roles.includes('editor') && claims.isAdmin
   *    }
   *  }
   * ```
   */
  validators?: Partial<Validators>;

  /**
   * Clock tolerance (in secs) used when validating the `exp` and `iat` claim.
   * Defaults to 5 secs.
   */
  clockTolerance?: number;

  /**
   * Maximum age (in secs) from when a token was issued to when it can no longer
   * be accepted.
   */
  maxTokenAge?: number;

  /**
   * If set to `true` the token validation will strictly follow
   * 'JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens'
   * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-access-token-jwt-12
   * Defaults to false.
   */
  strict?: boolean;

  /**
   * Secret to verify an Access Token JWT signed with a symmetric algorithm.
   * By default this SDK validates tokens signed with asymmetric algorithms.
   */
  secret?: string;

  /**
   * You must provide this if your tokens are signed with symmetric algorithms
   * and it must be one of HS256, HS384 or HS512.
   * You may provide this if your tokens are signed with asymmetric algorithms
   * and, if provided, it must be one of RS256, RS384, RS512, PS256, PS384,
   * PS512, ES256, ES256K, ES384, ES512 or EdDSA (case-sensitive).
   */
  tokenSigningAlg?: string;
}

export interface VerifyJwtResult {
  /**
   * The Access Token JWT header.
   */
  header: JWSHeaderParameters;
  /**
   * The Access Token JWT payload.
   */
  payload: JWTPayload;
  /**
   * The raw Access Token JWT
   */
  token: string;
}

export type VerifyJwt = (jwt: string) => Promise<VerifyJwtResult>;

type GetKeyFn = ReturnType<typeof createRemoteJWKSet>;

const ASYMMETRIC_ALGS = [
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'PS384',
  'PS512',
  'ES256',
  'ES256K',
  'ES384',
  'ES512',
  'EdDSA',
];
const SYMMETRIC_ALGS = ['HS256', 'HS384', 'HS512'];

const jwtVerifier = ({
  issuerBaseURL = process.env.ISSUER_BASE_URL as string,
  jwksUri = process.env.JWKS_URI as string,
  issuer = process.env.ISSUER as string,
  audience = process.env.AUDIENCE as string,
  secret = process.env.SECRET as string,
  tokenSigningAlg = process.env.TOKEN_SIGNING_ALG as string,
  agent,
  cooldownDuration = 30000,
  timeoutDuration = 5000,
  clockTolerance = 5,
  maxTokenAge,
  strict = false,
  validators: customValidators,
}: JwtVerifierOptions): VerifyJwt => {
  let origJWKS: GetKeyFn;
  let discovery: Promise<IssuerMetadata>;
  let validators: Validators;
  let allowedSigningAlgs: string[] | undefined;

  assert(
    issuerBaseURL || (issuer && jwksUri) || (issuer && secret),
    "You must provide an 'issuerBaseURL', an 'issuer' and 'jwksUri' or an 'issuer' and 'secret'"
  );
  assert(
    !(secret && jwksUri),
    "You must not provide both a 'secret' and 'jwksUri'"
  );
  assert(audience, "An 'audience' is required to validate the 'aud' claim");
  assert(
    !secret || (secret && tokenSigningAlg),
    "You must provide a 'tokenSigningAlg' for validating symmetric algorithms"
  );
  assert(
    secret || !tokenSigningAlg || ASYMMETRIC_ALGS.includes(tokenSigningAlg),
    `You must supply one of ${ASYMMETRIC_ALGS.join(
      ', '
    )} for 'tokenSigningAlg' to validate asymmetrically signed tokens`
  );
  assert(
    !secret || (tokenSigningAlg && SYMMETRIC_ALGS.includes(tokenSigningAlg)),
    `You must supply one of ${SYMMETRIC_ALGS.join(
      ', '
    )} for 'tokenSigningAlg' to validate symmetrically signed tokens`
  );

  const secretKey = secret && createSecretKey(Buffer.from(secret));

  const JWKS = async (...args: Parameters<GetKeyFn>) => {
    if (secretKey) return secretKey;
    if (!origJWKS) {
      origJWKS = createRemoteJWKSet(new URL(jwksUri), {
        agent,
        cooldownDuration,
        timeoutDuration,
      });
    }
    return origJWKS(...args);
  };

  return async (jwt: string) => {
    try {
      if (issuerBaseURL) {
        discovery =
          discovery || discover(issuerBaseURL, { agent, timeoutDuration });
        ({
          jwks_uri: jwksUri,
          issuer,
          id_token_signing_alg_values_supported: allowedSigningAlgs,
        } = await discovery);
      }
      validators ||= {
        ...defaultValidators(
          issuer,
          audience,
          clockTolerance,
          maxTokenAge,
          strict,
          allowedSigningAlgs,
          tokenSigningAlg
        ),
        ...customValidators,
      };
      const { payload, protectedHeader: header } = await jwtVerify(
        jwt,
        JWKS,
      );
      await validate(payload, header, validators);
      return { payload, header, token: jwt };
    } catch (e) {
      throw new InvalidTokenError(e.message);
    }
  };
};

export default jwtVerifier;

export { JWTPayload, JWSHeaderParameters };
