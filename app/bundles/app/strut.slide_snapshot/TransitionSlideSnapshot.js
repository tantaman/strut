/**
 * @author Matt Crinklaw-Vogt
 */
define(["strut/slide_components/view/ThreeDRotatableComponentView",
	"./SlideDrawer",
	"css!styles/transition_editor/TransitionSlideSnapshot.css",
	"strut/deck/Utils"],
	function(ThreeDComponentView, SlideDrawer, empty, DeckUtils) {
		var overviewSize = window.config.slide.overviewSize;

		/**
		 * This is a special kind of component, shown in transition editor (Overview mode). It inherits a lot of component
		 * UI goodies such as drag-n-drop ability, but looks like a slide snapshot.
		 *
		 * @class TransitionSlideSnapshot
		 * @augments ThreeDRotatableComponentView
		 */
		return ThreeDComponentView.extend({
			className: "component transitionSlideSnapshot",

			/**
			 * Returns list of Backbone events.
			 *
			 * @returns {Object}
			 */
			events: function() {
				var parentEvents;
				parentEvents = ThreeDComponentView.prototype.events();
				return _.extend(parentEvents, {
					"mousedown": "mousedown"
				});
			},

			/**
			 * Initialize transition snapshot.
			 */
			initialize: function() {
				ThreeDComponentView.prototype.initialize.apply(this, arguments);
				this.model.on('change:impScale', this._impScaleChanged, this);
				this.model.on('change:background', this._backgroundChanged, this);
				this.model.on('change:surface', this._backgroundChanged, this);
				this.options.deck.on('change:background', this._backgroundChanged, this);
				this.options.deck.on('change:surface', this._backgroundChanged, this);
			},

			/**
			 * Remove transition snapshot.
			 */
			remove: function() {
				this.dispose();
				ThreeDComponentView.prototype.remove.call(this, false);
				this.model.set("selected", false);
			},

			/**
			 * Dispose transition snapshot.
			 */
			dispose: function() {
				if (this.slideDrawer != null) {
					this.slideDrawer.dispose();
				}
				ThreeDComponentView.prototype.dispose.call(this);
				this.model.off(null, null, this);
				this.options.deck.off(null, null, this);
			},

			/**
			 * Event: user pressed a mouse button over the component.
			 * @param {jQuery.Event} e
			 */
			mousedown: function(e) {
				var multiselect = e.ctrlKey || e.metaKey || e.shiftKey;
				if(!multiselect && !this.model.get("selected")) {
					this.model.set("active", true);
				}
				ThreeDComponentView.prototype.mousedown.apply(this, arguments);
			},

			/**
			 * React on slide scale transition change.
			 */
			_impScaleChanged: function() {
				var scaleFactor = this.model.get('impScale') | 0;
				var $content = this.$el.find('.content');
				var width = overviewSize.width * scaleFactor;
				var height = overviewSize.height * scaleFactor;

				var size = {
					width: width,
					height: height
				};
				$content.css(size);
				this.slideDrawer.setSize(size);
			},

			/**
			 * React on background change.
			 */
			_backgroundChanged: function(deck, bg) {
				this._$content.removeClass();
				this._$content.addClass('content');
				this.slideDrawer.applyBackground(this.model, this.options.deck, {transparentForDeckSurface: true, surfaceForDefault: true});
			},

			/**
			 * Render transition slide snapshot.
			 *
			 * @returns {TransitionSlideSnapshot}
			 */
			render: function() {
				ThreeDComponentView.prototype.render.apply(this, arguments);
				if (this.slideDrawer != null) {
					this.slideDrawer.dispose();
				}

				this.$el.css({
					left: this.model.get("x"),
					top: this.model.get("y")
				});

				// this.$el.class();
				this._$content = this.$el.find('.content');

				var $el = this.$el.find('.slideDrawer');
				this.slideDrawer = new SlideDrawer(this.model, $el);
				this.slideDrawer.applyBackground(this.model, this.options.deck, {transparentForDeckSurface: true, surfaceForDefault: true});

				this._impScaleChanged();

				this.slideDrawer.render();

				return this;
			},

			/**
			 * Get view template.
			 *
			 * @returns {*}
			 * @private
			 */
			__getTemplate: function() {
				return JST["strut.slide_snapshot/TransitionSlideSnapshot"];
			},

			constructor: function TransitionSlideSnapshot() {
				ThreeDComponentView.prototype.constructor.apply(this, arguments);
			}
		});
	});
