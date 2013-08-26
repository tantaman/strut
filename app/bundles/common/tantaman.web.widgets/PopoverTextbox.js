define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click .ok': '_save'
		},

		initialize: function() {
			this.template = JST['tantaman.web.widgets/PopoverTextbox'];
		},

		show: function(cb) {
			this._cb = cb;
		},

		hide: function() {

		},

		_save: function() {
			this._cb(this.$input.val());
		},

		render: function() {
			this.$el.html(this.template(this.options));
			this.$input = this.$el.find('input');

			return this;
		},

		constructor: function PopoverTextbox() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});