define(['common/EventEmitter', 'lodash'], 
function (EventEmitter, _) {
	var identity = function(p) {return p;};

	function ServiceCollection(registry, lookup, converter) {
		var t = new EventEmitter();
		for (var i in t) {
			this[i] = t[i];
		}
		
		this._idToItem = {};
		this._lookup = registry.normalize(lookup);
		this._converter = converter || identity;
		this._registry = registry;

		this._register();
		this._populateItems();
	}

	ServiceCollection.toServiceConverter = function(entry) {
		return entry.service();
	}

	var proto = ServiceCollection.prototype = Object.create(Array.prototype);

	proto._register = function() {
		this._registry.on('registered', this._serviceRegistered, this);
		this._registry.on('deregistered', this._serviceDeregistered, this);
	};

	proto._serviceDeregistered = function(entry) {
		if (entry.matches(this._lookup)) {
			this._handleRemoval(entry);
		}
	};

	proto._handleRemoval = function(entry) {
		var item = this._idToItem[entry.serviceIdentifier()];

		if (!Array.isArray(item))
			item = [item];

		item.forEach(function(item) {
			var i = this.indexOf(item);
			this.splice(i, 1);
			this.emit('deregistered', item, entry, i);
		}, this);
	};

	proto._serviceRegistered = function(entry) {
		if (entry.matches(this._lookup)) {
			var item = this._converter(entry);
			this._handleAddition(item, entry);
		}
	};

	proto._populateItems = function() {
		var entries = this._registry.get(this._lookup);
		entries.forEach(function(entry) {
			var item = this._converter(entry);
			this._handleAddition(item, entry);
		}, this)
	};

	proto._handleAddition = function(item, entry) {
		this._idToItem[entry.serviceIdentifier()] = item;
		if (Array.isArray(item)) {
			item.forEach(function(i) {
				this.push(i);
				this.emit('registered', item, entry, i);
			}, this);
		} else {
			this.push(item);
			this.emit('registered', item, entry, this.length - 1);
		}
	}

	proto.dispose = function() {
		this._registry.off(null, null, this);
	};

	return ServiceCollection;
});