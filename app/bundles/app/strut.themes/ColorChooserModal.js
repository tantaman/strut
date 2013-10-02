define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: 'modal hide',
		events: {
			'click .ok': '_apply'
		},

		initialize: function() {
			this._color = '#EEE';
		},

		show: function(cb) {
			this._cb = cb;
			this.$el.modal('show');
		},

		hide: function() {
			this.$el.modal('hide');
		},

		_apply: function() {
			this._cb(this._color.toHexString());
		},

		render: function() {
			this.$el.html(JST['strut.themes/ColorChooserModal']());
			this._$colorChooser = this.$el.find('.color-chooser');
			this._$colorChooser.spectrum({
				color: this._color,
				showSelectionPalette: true,
          		localStorageKey: 'strut.bgColorChooser',
          		showPalette: true,
          		showInitial: true,
          		showInput: true,
          		palette: [],
          		clickoutFiresChange: true,
          		theme: 'sp-dark',
          		flat: true,
          		move: function(color) {
          			this._color = color;
          		}
			});
			this.$el.modal({
				show: false
			});

			return this;
		},

		constructor: function ColorChooserModal() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});