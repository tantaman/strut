import {
  claimCheck,
  claimEquals,
  claimIncludes,
  requiredScopes,
  scopeIncludesAny,
  UnauthorizedError,
  InvalidTokenError,
  InsufficientScopeError,
} from '../src';

describe('claim-check', () => {
  describe('claimCheck', () => {
    it('should expect a function', () => {
      expect(claimCheck).toThrowError("'claimCheck' expects a function");
    });

    it('should throw for no request', () => {
      expect(claimCheck(() => true)).toThrowError(UnauthorizedError);
    });

    it('should throw for an empty payload', () => {
      expect(claimCheck(() => true).bind(null)).toThrowError(UnauthorizedError);
    });

    it('should throw when check function returns false', () => {
      expect(claimCheck(() => false).bind(null, {})).toThrowError(
        InvalidTokenError
      );
    });

    it('should throw with custom error message when check function returns false', () => {
      expect(claimCheck(() => false, 'foo').bind(null, {})).toThrowError('foo');
    });

    it('should not throw when check function returns true', () => {
      expect(claimCheck(() => true).bind(null, {})).not.toThrow();
    });
  });

  describe('claimEquals', () => {
    it('should expect a string claim', () => {
      expect(claimEquals).toThrowError("'claim' must be a string");
    });

    it('should expect a JSON primitive claim value', () => {
      expect(claimEquals.bind(null, 'claim', {} as string)).toThrowError(
        "expected' must be a string, number, boolean or null"
      );
    });

    it('should allow a JSON primitive claim value', () => {
      for (const value of ['foo', 1, true, null]) {
        expect(claimEquals.bind(null, 'claim', value)).not.toThrow();
      }
    });

    it('should throw if claim not in payload', () => {
      expect(claimEquals('foo', 'bar').bind(null, {})).toThrowError(
        "Missing 'foo' claim"
      );
    });

    it(`should throw if claim doesn't match expected`, () => {
      expect(claimEquals('foo', 'bar').bind(null, { foo: 'baz' })).toThrowError(
        "Unexpected 'foo' value"
      );
    });

    it('should not throw if claim matches expected', () => {
      expect(
        claimEquals('foo', 'bar').bind(null, { foo: 'bar' })
      ).not.toThrow();
    });
  });

  describe('claimIncludes', () => {
    it('should expect a string claim', () => {
      expect(claimIncludes).toThrowError("'claim' must be a string");
    });

    it('should throw if claim not in payload', () => {
      expect(claimIncludes('foo', 'bar').bind(null, {})).toThrowError(
        "Missing 'foo' claim"
      );
    });

    it('should allow JSON primitive claim values', () => {
      expect(claimIncludes.bind(null, 'foo', 'bar', 1, false)).not.toThrow();
    });

    it('should throw if expected is not found in actual claim string', () => {
      expect(
        claimIncludes('foo', 'bar', 'baz').bind(null, {
          foo: 'qux quxx',
        })
      ).toThrowError("Unexpected 'foo' value");
    });

    it('should throw if all expected are not found in actual claim array', () => {
      expect(
        claimIncludes('foo', 'bar', 'baz').bind(null, {
          foo: ['qux', 'bar'],
        })
      ).toThrowError("Unexpected 'foo' value");
    });

    it('should throw if actual is not array or string', () => {
      expect(
        claimIncludes('foo', 'bar', 'baz').bind(null, {
          foo: true,
        })
      ).toThrowError("Unexpected 'foo' value");
    });

    it('should not throw if all expected found in actual string', () => {
      expect(
        claimIncludes('foo', 'bar', 'baz').bind(null, {
          foo: 'foo bar baz',
        })
      ).not.toThrow();
    });

    it('should not throw if all expected found in actual array', () => {
      expect(
        claimIncludes('foo', 'bar', 'baz').bind(null, {
          foo: ['foo', 'bar', 'baz'],
        })
      ).not.toThrow();
    });
  });

  describe('requiredScopes', () => {
    it('should expect a string or array of strings', () => {
      expect(requiredScopes).toThrowError(
        "scopes' must be a string or array of strings"
      );
    });

    it('should throw if no scope claim found', () => {
      expect(requiredScopes('foo bar').bind(null, { foo: 'bar' })).toThrowError(
        new InsufficientScopeError(['foo', 'bar'], "Missing 'scope' claim")
      );
    });

    it('should throw if all scopes from string not found in actual', () => {
      expect(
        requiredScopes('foo bar').bind(null, { scope: 'bar baz' })
      ).toThrowError(new InsufficientScopeError(['foo', 'bar']));
    });

    it('should throw if all scopes from array not found in actual', () => {
      expect(
        requiredScopes(['foo', 'bar']).bind(null, {
          scope: 'bar baz',
        })
      ).toThrowError(new InsufficientScopeError(['foo', 'bar']));
    });

    it('should not throw if all scopes found in actual', () => {
      expect(
        requiredScopes(['foo', 'bar']).bind(null, {
          scope: 'foo bar',
        })
      ).not.toThrow();
    });
  });

  describe('scopeIncludesAny', () => {
    it('should expect a string or array of strings', () => {
      expect(scopeIncludesAny).toThrowError(
        "scopes' must be a string or array of strings"
      );
    });

    it('should throw if no scope claim found', () => {
      expect(scopeIncludesAny('foo bar').bind(null, { foo: 'bar' })).toThrowError(
        new InsufficientScopeError(['foo', 'bar'], "Missing 'scope' claim")
      );
    });

    it('should throw if all scopes from string not found in actual', () => {
      expect(
        scopeIncludesAny('foo bar').bind(null, { scope: 'baz' })
      ).toThrowError(new InsufficientScopeError(['foo', 'bar']));
    });

    it('should throw if no scopes from array not found in actual', () => {
      expect(
        scopeIncludesAny(['foo', 'bar']).bind(null, {
          scope: 'baz',
        })
      ).toThrowError(new InsufficientScopeError(['foo', 'bar']));
    });

    it('should not throw if all scopes found in actual', () => {
      expect(
        scopeIncludesAny(['foo', 'bar']).bind(null, {
          scope: 'foo bar',
        })
      ).not.toThrow();
    });

    it('should not throw if any scopes found in actual', () => {
      expect(
        scopeIncludesAny(['foo', 'bar']).bind(null, {
          scope: 'foo qux quxx',
        })
      ).not.toThrow();
    });
  })
});
