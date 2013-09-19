define(['libs/backbone'],
function(Backbone) {
	'use strict';

	/**
	 * @class Button
	 */
	return Backbone.View.extend({
		className: 'btn btn-plast',
		tagName: 'a',

		events: {
			'click': '_clicked'
		},

		initialize: function() {
		},

		_clicked: function() {
			if (!this._disabled)
				this.options.cb();
		},

		render: function() {
			this.$el.html('<i class="' + this.options.icon + ' icon-white"></i>' + this.options.name);
			return this;
		},

		disable: function() {
			this.$el.addClass('disabled');
			this._disabled = true;
		},

		enable: function() {
			this._disabled = false;
			this.$el.removeClass('disabled');
		},

		constructor: function ThemeButton() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});