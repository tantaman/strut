define(['common/EventEmitter'],
function (EventEmitter) {
	'use strict';

	var identity = function(p) {return p;};

	function ServiceCollection(registry, lookup, converter) {
		_.extend(this, new EventEmitter());
		this._lookup = registry.normalize(lookup);
		this._converter = converter || identity;
		this._registry = registry;

		this._register();
		this._populateItems();
	}

	var proto = ServiceCollection.prorotype = Object.create(Array.prototype);

	proto._register = function() {
		this._registry.on('registered', this._serviceRegistered, this);
	};

	proto._serviceRegistered = function(entry) {
		if (entry.matches(this._lookup)) {
			var item = this._converter(entry);
			this.push(item);
			this.emit('add', this, item);
		}
	};

	proto._populateItems = function() {
		var entries = this._registry.get(this._lookup);
		entries.forEach(function(entry) {
			var item = this._converter(entry);
			this.push(item);
		}, this)
	};

	proto.dispose = function() {
		this._registry.off(null, null, this);
	};

	return ServiceCollection;
});