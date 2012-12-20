define(['common/Calcium'],
function(Calcium) {
	return Calcium.Model.extend({
		initialize: function() {

		},

		constructor: function Slide() {
			Calcium.Model.prototype.constructor.apply(this, arguments);
		}
	});
});