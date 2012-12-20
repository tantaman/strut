define(['common/Calcium'],
function(Calcium) {
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