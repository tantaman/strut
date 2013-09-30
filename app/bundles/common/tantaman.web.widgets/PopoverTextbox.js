define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click .ok': '_save',
			'click .cancel': 'hide',
			'click': '_stopProp',
			'mousedown': '_stopProp'
		},

		className: 'popover',

		initialize: function() {
			this.hide = this.hide.bind(this);
			// $(document).bind('click', this.hide);
			this.template = JST['tantaman.web.widgets/PopoverTextbox'];
		},

		show: function(position, cb, text) {
			console.log('Showing popover');
			this._cb = cb;
			this.$el.css(position);
			this.$el.css('display', 'block');
			this.$input.val(text);
			this.$input.focus();
		},

		hide: function() {
			this.$el.css('display', '');
			this.$input.val('');
		},

		_save: function(e) {
			e.stopPropagation();
			this._cb(this.$input.val());
		},

		_stopProp: function(e) {
			e.stopPropagation();
		},

		render: function() {
			this.$el.html(this.template(this.options));
			this.$input = this.$el.find('input');

			return this;
		},

		remove: function() {
			Backbone.View.prototype.remove.apply(this, arguments);
			// $(document).unbind('click', this.hide);
		},

		constructor: function PopoverTextbox() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});