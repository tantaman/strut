define(function() {
	function ServiceRegistry() {
		this._services = {};
	}

	ServiceRegistry.prototype = {
		register: function(interfaces, service) {
			if (typeof interfaces === 'string') {
				interfaces = [interfaces];
			}

			interfaces.forEach(function(iface) {
				var existing = this._services[iface];
				if (existing == null) {
					existing = [];
					this._services[iface] = existing;
				}

				existing.push(service);
			}, this);
		},

		get: function(interfaces) {
			var services = this.getAll(interfaces);
			if (services != null) {
				return services[0];
			}
		},

		getAll: function(interfaces) {
			if (typeof interfaces === 'string') {
				return this._services[interfaces];
			} else {
				var result = null;
				for (var i = 0; i < interfaces.length; ++i) {
					if (result == null) {
						result = this._services[interfaces[i]];
						if (result == null)
							return null;
					} else {
						result = _.intersection(result, this._services[interfaces[i]]);
						if (result.length == 0)
							return null;
					}
				}
			}

			return result;
		}
	};

	return ServiceRegistry;
});

