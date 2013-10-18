(function() {
 function definition() {
	var defaultOptions = {
		manageRevocation: true
	};

	function defaults(options, defaultOptions) {
		for (var k in defaultOptions) {
			if (options[k] === undefined)
				options[k] = defaultOptions[k];
		}

		return options;
	}

	function add(docKey, attachKey, url) {
		if (this.options.manageRevocation)
			expunge.call(this, docKey, attachKey, true);

		var mainCache = this.cache.main;
		var docCache = mainCache[docKey];
		if (!docCache) {
			docCache = {};
			mainCache[docKey] = docCache;
		}

		docCache[attachKey] = url;
		this.cache.reverse[url] = {docKey: docKey, attachKey: attachKey};
	}

	function addAll(urlEntries) {
		urlEntries.forEach(function(entry) {
			add.call(this, entry.docKey, entry.attachKey, entry.url);
		}, this);
	}

	function expunge(docKey, attachKey, needsRevoke) {
		function delAndRevoke(attachKey) {
			var url = docCache[attachKey];
			delete docCache[attachKey];
			delete this.cache.reverse[url];
			if (this.options.manageRevocation && needsRevoke)
				this.llshandler.revokeAttachmentURL(url, {bypassUrlCache: true});
		}

		var docCache = this.cache.main[docKey];
		if (docCache) {
			if (attachKey) {
				delAndRevoke.call(this, attachKey);
			} else {
				for (var attachKey in docCache) {
					delAndRevoke.call(this, attachKey);
				}
				delete this.cache.main[docKey];
			}
		}
	}

	function expungeByUrl(url) {
		var keys = this.cache.reverse[url];
		if (keys) {
			expunge.call(this, keys.docKey, keys.attachKey, false);
		}
	}


	function URLCache(llspipe, options) {
		options = options || {};
		this.options = defaults(options, defaultOptions);
		this.llshandler = llspipe.pipe.getHandler('lls');
		this.pending = {};
		this.cache = {
			main: {},
			reverse: {}
		};
	}

	URLCache.prototype = {
		setAttachment: function(docKey, attachKey, blob) {
			expunge.call(this, docKey, attachKey);
			return this.__pipectx.next(docKey, attachKey, blob);
		},

		rmAttachment: function(docKey, attachKey) {
			expunge.call(this, docKey, attachKey);
			return this.__pipectx.next(docKey, attachKey);
		},

		rm: function(docKey) {
			expunge.call(this, docKey);
			return this.__pipectx.next(docKey);
		},

		revokeAttachmentURL: function(url, options) {
			if (!options || !options.bypassUrlCache)
				expungeByUrl.call(this, url);

			return this.__pipectx.next(url, options);
		},

		getAttachmentURL: function(docKey, attachKey) {
			var pendingKey = docKey + attachKey;
			var pending = this.pending[pendingKey];
			if (pending)
				return pending;

			var promise = this.__pipectx.next(docKey, attachKey);
			var self = this;
			promise.then(function(url) {
				add.call(self, docKey, attachKey, url);
				delete self.pending[pendingKey];
			});

			this.pending[pendingKey] = promise;

			return promise;
		},

		// TODO: pending between this and getAttachmentURL...
		// Execute this as an ls and then
		// a loop on getAttachmentURL instead???
		// doing it the way mentiond above
		// will prevent us from leaking blobs.
		getAllAttachmentURLs: function(docKey) {
			var promise = this.__pipectx.next(docKey);
			var self = this;
			promise.then(function(urlEntries) {
				addAll.call(self, urlEntries);
			});

			return promise;
		},

		clear: function() {
			this.revokeAllCachedURLs();
			return this.__pipectx.next();
		},

		revokeAllCachedURLs: function() {
			for (var url in this.cache.reverse) {
				this.llshandler.revokeAttachmentURL(url, {bypassUrlCache: true});
			}

			this.cache.reverse = {};
			this.cache.main = {};
		}
	};

	return {
		addTo: function(lls, options) {
			var cache = new URLCache(lls, options);
			lls.pipe.addFirst('URLCache', cache);
			return lls;
		}
	}
}

if (typeof define == 'function' && define.amd) {
	define(['lls/LargeLocalStorage'], function(lls) {
		lls.contrib.URLCache = definition();
		return lls.contrib.URLCache;
	});
} else {
	LargeLocalStorage.contrib.URLCache = definition();
}

})();