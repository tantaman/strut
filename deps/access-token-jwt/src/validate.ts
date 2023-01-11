import type { JWTPayload, JWSHeaderParameters } from 'jose';

/**
 * @ignore
 */
export type FunctionValidator = (
  value: unknown,
  claims: JWTPayload,
  header: JWSHeaderParameters
) => Promise<boolean> | boolean;

/**
 * @ignore
 */
export type Validator = FunctionValidator | string | false | undefined;

/**
 * @ignore
 */
export interface Validators {
  alg: Validator;
  typ: Validator;
  iss: Validator;
  aud: Validator;
  exp: Validator;
  iat: Validator;
  sub: Validator;
  client_id: Validator;
  jti: Validator;
  [key: string]: Validator;
}

export default (
  payload: JWTPayload,
  header: JWSHeaderParameters,
  validators: Validators
): Promise<void[]> =>
  Promise.all(
    Object.entries(validators).map(
      async ([key, validator]: [string, Validator]) => {
        const value =
          key === 'alg' || key === 'typ' ? header[key] : payload[key];
        if (
          validator === false ||
          (typeof validator === 'string' && value === validator) ||
          (typeof validator === 'function' &&
            (await validator(value, payload, header)))
        ) {
          return;
        }
        throw new Error(`Unexpected '${key}' value`);
      }
    )
  );

export const defaultValidators = (
  issuer: string,
  audience: string | string[],
  clockTolerance: number,
  maxTokenAge: number | undefined,
  strict: boolean,
  allowedSigningAlgs: string[] | undefined,
  tokenSigningAlg: string | undefined
): Validators => ({
  alg: (alg) =>
    typeof alg === 'string' &&
    alg.toLowerCase() !== 'none' &&
    (!allowedSigningAlgs || allowedSigningAlgs.includes(alg)) &&
    (!tokenSigningAlg || alg === tokenSigningAlg),
  typ: (typ) =>
    !strict ||
    (typeof typ === 'string' &&
      typ.toLowerCase().replace(/^application\//, '') === 'at+jwt'),
  iss: (iss) => iss === issuer,
  aud: (aud) => {
    audience = typeof audience === 'string' ? [audience] : audience;
    if (typeof aud === 'string') {
      return audience.includes(aud);
    }
    if (Array.isArray(aud)) {
      return audience.some(Set.prototype.has.bind(new Set(aud)));
    }
    return false;
  },
  exp: (exp) => {
    const now = Math.floor(Date.now() / 1000);
    return typeof exp === 'number' && exp >= now - clockTolerance;
  },
  iat: (iat) => {
    if (!maxTokenAge) {
      return (iat === undefined && !strict) || typeof iat === 'number';
    }
    const now = Math.floor(Date.now() / 1000);
    return (
      typeof iat === 'number' &&
      iat < now + clockTolerance &&
      iat > now - clockTolerance - maxTokenAge
    );
  },
  sub: (sub) => (sub === undefined && !strict) || typeof sub === 'string',
  client_id: (clientId) =>
    (clientId === undefined && !strict) || typeof clientId === 'string',
  jti: (jti) => (jti === undefined && !strict) || typeof jti === 'string',
});
