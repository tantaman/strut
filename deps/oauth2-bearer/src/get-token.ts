/**
 * Get a Bearer Token from a request per https://tools.ietf.org/html/rfc6750#section-2
 */
import { InvalidRequestError, UnauthorizedError } from './errors';

type QueryLike = Record<string, unknown> & { access_token?: string };
type BodyLike = QueryLike;
type HeadersLike = Record<string, unknown> & {
  authorization?: string;
  'content-type'?: string;
};

const TOKEN_RE = /^Bearer (.+)$/i;

const getTokenFromHeader = (headers: HeadersLike) => {
  if (typeof headers.authorization !== 'string') {
    return;
  }
  const match = headers.authorization.match(TOKEN_RE);
  if (!match) {
    return;
  }
  return match[1];
};

const getTokenFromQuery = (query?: QueryLike) => {
  const accessToken = query?.access_token;
  if (typeof accessToken === 'string') {
    return accessToken;
  }
};

const getFromBody = (body?: BodyLike, urlEncoded?: boolean) => {
  const accessToken = body?.access_token;
  if (typeof accessToken === 'string' && urlEncoded) {
    return accessToken;
  }
};

/**
 * Get a Bearer Token from a request.
 *
 * @param headers An object containing the request headers, usually `req.headers`.
 * @param query An object containing the request query parameters, usually `req.query`.
 * @param body An object containing the request payload, usually `req.body` or `req.payload`.
 * @param urlEncoded true if the request's Content-Type is `application/x-www-form-urlencoded`.
 */
export default function getToken(
  headers: HeadersLike,
  query?: QueryLike,
  body?: BodyLike,
  urlEncoded?: boolean
): string {
  const fromHeader = getTokenFromHeader(headers);
  const fromQuery = getTokenFromQuery(query);
  const fromBody = getFromBody(body, urlEncoded);

  if (!fromQuery && !fromHeader && !fromBody) {
    throw new UnauthorizedError();
  }

  if (+!!fromQuery + +!!fromBody + +!!fromHeader > 1) {
    throw new InvalidRequestError(
      'More than one method used for authentication'
    );
  }

  return (fromQuery || fromBody || fromHeader) as string;
}
