define(["libs/backbone"],
function(Backbone) {
	function isModelish(obj) {
		return obj instanceof Backbone.Model ||
			obj instanceof Backbone.Collection;
	}

	/**
	 * @class Calcium.Model
	 */
	var Model = Backbone.Model.extend({
		// ugh.. hax w/ the inspectArrays param...
		// TODO: we need to detect object loops!!!!!!
		toJSON: function(dontRecurse, inspectArrays) {
			if (dontRecurse) {
				return Backbone.Model.prototype.toJSON.apply(this, arguments);
			} else {
				var result = {};
				for (var attr in this.attributes) {
					var obj = this.attributes[attr];
					if (isModelish(obj)) {
						result[attr] = obj.toJSON(dontRecurse, inspectArrays);
					} else if (inspectArrays && obj instanceof Array) {
						var resArr = [];
						result[attr] = resArr;
						obj.forEach(function(elem, idx) {
							if (isModelish(elem))
								resArr.push(elem.toJSON(dontRecurse, inspectArrays))
							else
								resArr.push(elem)
						});
					} else {
						result[attr] = obj;
					}
				}

				return result;
			}
		}
	});

	var Collection = Backbone.Collection.extend({
		toJSON: function(dontRecurse, inspectArrays) {
			if (dontRecurse) {
				return Backbone.Collection.prototype.toJSON.apply(this, arguments);
			} else {
				var resArr = [];
				this.models.forEach(function(model, idx) {
					resArr.push(model.toJSON(dontRecurse, inspectArrays))
				});
				return resArr;
			}
		}
	});

	function Disposable(obj, fn, args) {
		this.args = args;
		this.obj = obj;
		this.fn = fn;
	}

	Disposable.prototype = {
		dispose: function() {
			this.fn.apply(this.obj, this.args);
		}
	};

	return {
		Model: Model,
		Collection: Collection
	}
});