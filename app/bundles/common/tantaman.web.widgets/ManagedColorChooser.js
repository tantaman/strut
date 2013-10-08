define(['libs/backbone', 'tantaman/web/Utils'],
function(Backbone, Utils) {
	'use strict';
	var instances = {};

	var defaults = {
		color: '#000',
		showSelectionPalette: true,
		localStorageKey: 'strut.colorChooser',
		showPalette: true,
		showInitial: true,
		showInput: true,
		palette: [],
		clickoutFiresChange: true,
		flat: false,
		position: 'absolute'
	};

	function ManagedColorChooser(opts) {
		opts = opts || {};
		_.defaults(opts, defaults);

		this.$el = $('<div class="dispNone"></div>');
		this.$el.on('mousedown', Utils.stopProp);
		this.$el.append('<input class="color-chooser colorpicker" />');
		this._$colorChooser = this.$el.find('.color-chooser');

		var self = this;
		opts.move = function(color) {
			self._colorUpdated(color);
		}

		if (opts.position)
			this.$el.css('position', opts.position);

		this._$colorChooser.spectrum(opts);
	}

	ManagedColorChooser.prototype = {
		_colorUpdated: function(color) {
			this.trigger('update:color', color);
		},

		show: function(opts) {
			this.$el.removeClass('dispNone');
			if (opts && opts.top != null && opts.left != null) {
				this.$el.css({
					top: opts.top,
					left: opts.left
				});
			}

			if (opts && opts.move) {
				this.on('update:color', opts.move);
			}

			if (opts && opts.appendTo) {
				if (this.$el.parent(opts.appendTo).length == 0)
					this.$el.appendTo(opts.appendTo);
			}
		},

		move: function(loc) {
			this.$el.css(loc);
		},

		hide: function(opts) {
			this.$el.addClass('dispNone');
			this._$colorChooser.spectrum('hide');
			if (opts && opts.move) {
				this.off('update:color', opts.move);
			}
		}
	};

	return {
		/**
		 * Get the color chooser with the given identifer.
		 * Creates it if it does not exist.
		 * "ManagedColorChooser" allows us to re-use the same
		 * chooser instance for multiple components.
		 * Kind of like a flyweight pattern.
		 */
		get: function(id, opts) {
			var inst;
			inst = instances[id];
			if (!inst) {
				inst = new ManagedColorChooser(opts);
				_.extend(inst, Backbone.Events);
				instances[id] = inst;
			}

			return inst;
		}
	};
});