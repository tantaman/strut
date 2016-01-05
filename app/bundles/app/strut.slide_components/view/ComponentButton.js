define(['libs/backbone'],
	function(Backbone) {
		'use strict';

		/**
		 * @class ComponentButton
		 * @augments Backbone.View
		 */
		return Backbone.View.extend({
			className: 'btn btn-plast',
			tagName: 'a',

			/**
			 * Returns list of events, tracked by this view.
			 *
			 * @returns {Object}
			 */
			events: {
				'click': '_clicked'
			},

			/**
			 * Initialize ComponentButton.
			 */
			initialize: function() {
				this.$el.attr('data-compType', this.options.componentType);
			},

			/**
			 * React on button click.
			 * @private
			 */
			_clicked: function() {
				this.options.editorModel.addComponent(this.options.componentType);
			},

			/**
			 * Render the button.
			 *
			 * @returns {*}
			 */
			render: function() {
				this.$el.html('<i class="' + this.options.icon + ' icon-white"></i>' + this.options.name);
				return this;
			},

			constructor: function ComponentButton() {
				Backbone.View.prototype.constructor.apply(this, arguments);
			}
		});
	});