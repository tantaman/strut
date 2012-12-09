define(['common/EventEmitter', 'common/collections/MultiMap'],
function(EventEmitter, MultiMap) {
	function ServiceRegistry() {
		this._services = new MultiMap();
	}

	var proto = ServiceRegistry.prototype = Object.create(EventEmitter.prototype);

	proto.register = function(opts, service) {
		var interfaces = Array.isArray(opts.interfaces) ? opts.interfaces : [opts.interfaces];

		var entry = new ServiceEntry(interfaces, opts.meta, service);

		interfaces.forEach(function(iface) {
			this._services.put(iface, entry);
		}, this);
	};

	function ServiceEntry(interfaces, meta, service) {
		this._interfaces = interfaces;
		this._meta = meta;
		this._service = service;
	}

	ServiceEntry.prototype = {
		equals: function(other) {

		},

		matches: function(other) {
			
		}
	};

	return ServiceRegistry;
});