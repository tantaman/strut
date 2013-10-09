if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['framework/sr/registry', 'framework/sr/tracker'], function(sr, sc) {
	return {
		ServiceRegistry: sr,
		ServiceCollection: sc
	}
});