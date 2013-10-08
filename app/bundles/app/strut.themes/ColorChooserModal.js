define(['libs/backbone'],
function(Backbone) {
	/**
	* A modal that present a flat color chooser.
	*/
	return Backbone.View.extend({
		className: 'modal hide',
		events: {
			'click .ok': '_apply'
		},

		initialize: function() {
			this._color = '#EEE';
		},

		/**
		* Show the modal.  cb is the
		* function that is called when a color is chosen.
		* @param {function} cb
		*/
		show: function(cb) {
			this._cb = cb;
			this.$el.modal('show');
		},

		hide: function() {
			this.$el.modal('hide');
		},

		_apply: function() {
			var c = typeof this._color == 'string' ? this._color : this._color.toHexString();
			this._$colorChooser.spectrum('set', this._color);
			this._cb(c);
			this.hide();
		},

		render: function() {
			var self = this;
			this.$el.html(JST['strut.themes/ColorChooserModal']());
			this._$body = this.$el.find('.modal-body');
			this._$colorChooser = this.$el.find('.color-chooser');
			this._$colorChooser.spectrum({
				color: this._color,
				showSelectionPalette: true,
          		localStorageKey: 'strut.colorChooser',
          		showPalette: true,
          		showInitial: true,
          		showInput: true,
          		palette: [],
          		clickoutFiresChange: true,
          		flat: true,
          		move: function(color) {
          			self._color = color;
          			self._$body.css('background', color.toHexString());
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