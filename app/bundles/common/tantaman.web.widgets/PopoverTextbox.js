define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click .ok': '_save',
			'click .cancel': '_cancel'
		},

		className: 'popover',

		initialize: function() {
			this.template = JST['tantaman.web.widgets/PopoverTextbox'];
		},

		show: function(position, cb) {
			console.log('Showing popover');
			this._cb = cb;
			this.$el.css(position);
			this.$el.css('display', 'block');
			this._prevVal = this.$input.val();
		},

		hide: function() {
			this.$el.css('display', '');
		},

		_save: function() {
			this._cb(this.$input.val());
		},

		_cancel: function() {
			this.$el.css('display', '');
			this.$input.val(this._prevVal);
			this._prevVal = '';
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