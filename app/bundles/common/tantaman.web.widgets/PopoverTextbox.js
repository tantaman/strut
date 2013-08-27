define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click .ok': '_save',
			'click .cancel': '_cancel',
			'click': '_stopProp'
		},

		className: 'popover',

		initialize: function() {
			this.hide = this.hide.bind(this);
			// $(document).bind('click', this.hide);
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

		_save: function(e) {
			e.stopPropagation();
			this._cb(this.$input.val());
		},

		_cancel: function(e) {
			this.$el.css('display', '');
			this.$input.val(this._prevVal);
			this._prevVal = '';
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