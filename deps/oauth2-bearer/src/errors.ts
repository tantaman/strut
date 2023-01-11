/**
 * Errors per https://tools.ietf.org/html/rfc6750#section-3.1
 */

/**
 * If the request lacks any authentication information,
 * the resource server SHOULD NOT include an error code or
 * other error information.
 */
export class UnauthorizedError extends Error {
  status = 401;
  statusCode = 401;
  headers = { 'WWW-Authenticate': 'Bearer realm="api"' };

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * The request is missing a required parameter, includes an
 * unsupported parameter or parameter value, repeats the same
 * parameter, uses more than one method for including an access
 * token, or is otherwise malformed.
 */
export class InvalidRequestError extends UnauthorizedError {
  code = 'invalid_request';
  status = 400;
  statusCode = 400;

  constructor(message = 'Invalid Request') {
    super(message);
    this.headers = getHeaders(this.code, this.message);
  }
}

/**
 * The access token provided is expired, revoked, malformed, or
 * invalid for other reasons.
 */
export class InvalidTokenError extends UnauthorizedError {
  code = 'invalid_token';
  status = 401;
  statusCode = 401;

  constructor(message = 'Invalid Token') {
    super(message);
    this.headers = getHeaders(this.code, this.message);
  }
}

/**
 * The request requires higher privileges than provided by the
 * access token.
 */
export class InsufficientScopeError extends UnauthorizedError {
  code = 'insufficient_scope';
  status = 403;
  statusCode = 403;

  constructor(scopes?: string[], message = 'Insufficient Scope') {
    super(message);
    this.headers = getHeaders(this.code, this.message, scopes);
  }
}

// Generate a response header per https://tools.ietf.org/html/rfc6750#section-3
const getHeaders = (error: string, description: string, scopes?: string[]) => ({
  'WWW-Authenticate': `Bearer realm="api", error="${error}", error_description="${description.replace(
    /"/g,
    "'"
  )}"${(scopes && `, scope="${scopes.join(' ')}"`) || ''}`,
});
