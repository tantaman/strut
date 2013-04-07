/**
@author Matt Crinklaw-Vogt
*/
define(function() {
	/**
	* Allows on to register objects or functions under interface names
	* and later retrieve them under those same interface names.
	*
	* Multiple services may be registered under the same interface name.
	* A single service may be also registered under multiple interface names.
	* @class ServiceRegsitry
	*/
	function ServiceRegistry() {
		this._services = {};
	}

	ServiceRegistry.prototype = {
		/**
		Register the service under the given interface name(s)
		@method register
		@param {Array|String} interfaces string or array of strings of the interface names
		@param {Object|function} service service to be registered
		*/
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

		/**
		Get the first service that has been registered under the given interface
		name(s)
		@method get
		@param {Array|String} interface or interfaces that the service should implement
		@return {Object|Function} the registered service or null
		*/
		get: function(interfaces) {
			var services = this.getAll(interfaces);
			if (services != null) {
				return services[0];
			}
		},

		/**
		Get all services registered under the given interface(s)
		@method getAll
		@param {Array|String} interfaces
		*/
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

