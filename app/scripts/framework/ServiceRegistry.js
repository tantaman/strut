define(['common/EventEmitter', 'common/collections/MultiMap', 'lodash'],
function(EventEmitter, MultiMap, _) {
	'use strict';
	var identifier = 0;

	/**
	 * @constructor
	 */
	function ServiceRegistry() {
		this._services = new MultiMap();
	}

	var proto = ServiceRegistry.prototype = Object.create(EventEmitter.prototype);

	proto.register = function(opts, service) {
		if (service.__registryIdentifier == null)
			service.__registryIdentifier = ++identifier;

		var interfaces;
		if (Array.isArray(opts)) {
			interfaces = opts;
			opts = {};
		} else if (typeof opts === 'string') {
			interfaces = [opts];
			opts = {};
		} else {
			interfaces = Array.isArray(opts.interfaces) ? opts.interfaces : [opts.interfaces];			
		}

		var entry = new ServiceEntry(interfaces, opts.meta, service);

		interfaces.forEach(function(iface) {
			this._services.put(iface, entry);
			this.emit('registered:' + iface, entry);
		}, this);
		this.emit('registered', entry);

		return this;
	};

	proto.deregister = function(opts) {
		opts = this.normalize(opts);
		this._deregister(opts);

		return this;
	};

	proto.on = function(topic, callback, context) {
		var result = EventEmitter.prototype.on.apply(this, arguments);
		var parts = topic.split(':');
		if (parts[0] == 'registered') {
			if (parts.length == 1) {
				console.log('immediate callback for naked registered not implemented.');
			} else {
				this._services.get(parts[1])
				.forEach(function(entry) {
					this.emit('registered:' + parts[1], entry);
				}, this);
			}
		}
		return result;
	};

	proto._deregister = function(opts) {
		var removed = [];
		opts.interfaces.forEach(function(iface) {
			var entries = this._services.get(iface);
			entries.forEach(function (entry, idx) {
				if (entry.matches(opts)) {
					this._services.remove(iface, entry);
					removed.push(entry);
				}
			}, this);
		}, this);

		removed.forEach(function(entry) {
			this.emit('deregistered', entry);
		}, this);
	};

	proto.getBest = function(opts) {
		var entry = this.getBestEntry(opts);
		if (entry != null)
			return entry.service();
		return null;
	};

	proto.getBestEntry = function(opts) {
		return this.get(opts)[0];
	};

	var Normalize = proto.normalize = function Normalize(opts) {
		var parms = {};
		if (typeof opts === 'string') {
			parms.interfaces = [opts];
		} else if (Array.isArray(opts)) {
			parms.interfaces = opts;
		} else {
			parms = opts;
			if (!Array.isArray(parms.interfaces))
				parms.interfaces = [parms.interfaces];
		}

		return parms;
	};

	proto.get = function(opts) {
		var parms = this.normalize(opts);

		var seen;
		var prevSeen = {};
		// For each interface
		parms.interfaces.some(function(iface, idx) {
			seen = {};
			// Get the services with that interface
			this._services.get(iface).forEach(function(entry) {
				// see if they match the query options
				if (entry.metaMatches(opts.meta)) {
					// If this is the first interface through or the service
					// has all the previous requested interfaces, add it
					// to 'seen'
					if (idx == 0 || prevSeen[entry.serviceIdentifier()] != null) {
						seen[entry.serviceIdentifier()] = entry;
					}
				}
			});
			// move the set of services matching all interfaces forward
			prevSeen = seen;
			// break the loop if no service matched the requested interface(s)
			return Object.keys(seen).length == 0;
		}, this);

		var result = [];

		for (var k in seen) {
			result.push(seen[k]);
		}

		return result;
	};

	proto.getInvoke = function(srvcOpts, methName, args) {
		var services = this.get(srvcOpts);

		var items = {};
		services.forEach(function(entry) {
			var srvc = entry.service();
			var item = srvc[methName].apply(srvc, args);
			items[item.id] = item;
		}, this);

		return items;
	};

	function ServiceEntry(interfaces, meta, service) {
		this._interfaces = interfaces;
		this._meta = meta || {};
		this._service = service;
	}

	ServiceEntry.prototype = {
		equals: function(other) {
			return other._service.__registryIdentifier == this._service.__registryIdentifier;
		},

		service: function() {
			return this._service;
		},

		meta: function() {
			return this._meta;
		},

		matches: function(opts) {
			opts = Normalize(opts);
			var ifSet = {};

			opts.interfaces.forEach(function(iface) {
				ifSet[iface] = true;
			});

			return this._interfaces.every(function(iface) {
				return ifSet[iface];
			});
		},

		metaMatches: function(meta) {
			if (meta == null) return true;

			for (var key in meta) {
				if (!_.isEqual(meta[key], this._meta[key]))
					return false;
			}

			return true;
		},

		serviceIdentifier: function() {
			return this._service.__registryIdentifier;
		}
	};

	return ServiceRegistry;
});