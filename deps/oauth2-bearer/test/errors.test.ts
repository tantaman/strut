import {
  UnauthorizedError,
  InvalidRequestError,
  InvalidTokenError,
  InsufficientScopeError,
} from '../src';

describe('errors', () => {
  it('should raise an Unauthorized error', () => {
    expect(new UnauthorizedError()).toMatchObject({
      headers: {
        'WWW-Authenticate': 'Bearer realm="api"',
      },
      message: 'Unauthorized',
      name: 'UnauthorizedError',
      status: 401,
      statusCode: 401,
    });
  });

  it('should raise an Invalid Request error', () => {
    expect(new InvalidRequestError()).toMatchObject({
      code: 'invalid_request',
      headers: {
        'WWW-Authenticate':
          'Bearer realm="api", error="invalid_request", error_description="Invalid Request"',
      },
      message: 'Invalid Request',
      name: 'InvalidRequestError',
      status: 400,
      statusCode: 400,
    });
  });

  it('should raise an Invalid Request error with a custom message', () => {
    expect(new InvalidRequestError('Custom Message')).toMatchObject({
      code: 'invalid_request',
      headers: {
        'WWW-Authenticate':
          'Bearer realm="api", error="invalid_request", error_description="Custom Message"',
      },
      message: 'Custom Message',
      name: 'InvalidRequestError',
      status: 400,
      statusCode: 400,
    });
  });

  it('should avoid nested double quotes in header', () => {
    expect(new InvalidRequestError('expected "foo" got "bar"')).toMatchObject({
      code: 'invalid_request',
      headers: {
        'WWW-Authenticate': `Bearer realm="api", error="invalid_request", error_description="expected 'foo' got 'bar'"`,
      },
      message: 'expected "foo" got "bar"',
      name: 'InvalidRequestError',
      status: 400,
      statusCode: 400,
    });
  });

  it('should raise an Invalid Token error', () => {
    expect(new InvalidTokenError()).toMatchObject({
      code: 'invalid_token',
      headers: {
        'WWW-Authenticate':
          'Bearer realm="api", error="invalid_token", error_description="Invalid Token"',
      },
      message: 'Invalid Token',
      name: 'InvalidTokenError',
      status: 401,
      statusCode: 401,
    });
  });

  it('should raise an Insufficient Scope error', () => {
    expect(new InsufficientScopeError(['foo', 'bar'])).toMatchObject({
      code: 'insufficient_scope',
      headers: {
        'WWW-Authenticate':
          'Bearer realm="api", error="insufficient_scope", error_description="Insufficient Scope", scope="foo bar"',
      },
      message: 'Insufficient Scope',
      name: 'InsufficientScopeError',
      status: 403,
      statusCode: 403,
    });
  });
});
