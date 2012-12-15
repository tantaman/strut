define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		dispose: function() {
			console.log("Disposed of");
		}
	});
});