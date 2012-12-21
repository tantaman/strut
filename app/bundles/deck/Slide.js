define(['common/Calcium',
		'./SpatialObject',
		'common/Math2'],
function(Calcium) {
	var defaults = {
		z: 0,
		impScale: 1,
		rotateX: 0,
		rotateY: 0,
		rotateZ: 0
	};

	return Calcium.Model.extend({
		initialize: function() {
			if (!this.get('components')) {
				this.set('components', []);
			}
		},

		constructor: function Slide() {
			Calcium.Model.prototype.constructor.apply(this, arguments);
		}
	});
});