/*
@author Matt Crinklaw-Vogt
*/
define(["strut/slide_components/view/ThreeDRotatableComponentView",
        "./SlideDrawer",
        "css!styles/transition_editor/TransitionSlideSnapshot.css"],
function(ThreeDComponentView, SlideDrawer, empty) {
  var overviewSize = window.config.slide.overviewSize;
  return ThreeDComponentView.extend({
    className: "component transitionSlideSnapshot",
    events: function() {
      var parentEvents;
      parentEvents = ThreeDComponentView.prototype.events();
      return _.extend(parentEvents, {
        "click": "clicked"
      });
    },
    initialize: function() {
      ThreeDComponentView.prototype.initialize.apply(this, arguments);
      this.model.on('change:impScale', this._impScaleChanged, this);
      this.options.deck.on('change:background', this._backgroundChanged, this);
    },
    remove: function() {
      this.dispose();
      ThreeDComponentView.prototype.remove.call(this, false);
      this.model.set("selected", false);
    },
    dispose: function() {
      if (this.slideDrawer != null) {
        this.slideDrawer.dispose();
      }
      ThreeDComponentView.prototype.dispose.call(this);
      this.model.off(null, null, this);
      this.options.deck.off(null, null, this);
    },
    clicked: function() {
      ThreeDComponentView.prototype.clicked.apply(this, arguments);
      this.model.set("active", true);

      this.$el.css('z-index', zTracker.next());
    },
    _impScaleChanged: function() {
      var scaleFactor = this.model.get('impScale') | 0;
      var $content = this.$el.find('.content');
      var width = overviewSize.width * scaleFactor;
      var height = overviewSize.height * scaleFactor;

      $content.css({
        width: width,
        height: height
      });
    },

    _backgroundChanged: function(deck, bg) {
     bg = this.model.get('background') || this.options.deck.slideBackground();
     this._$content.removeClass();
     this._$content.addClass('content ' + bg);
    },

    render: function() {
      var g2d;
      ThreeDComponentView.prototype.render.apply(this, arguments);
      if (this.slideDrawer != null) {
        this.slideDrawer.dispose();
      }
      var $canvas = this.$el.find('canvas');
      g2d = $canvas[0].getContext("2d");
      this.slideDrawer = new SlideDrawer(this.model, g2d, this.options.registry);
      this.slideDrawer.repaint();
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      // this.$el.class();
      var bg = this.model.get('background') || this.options.deck.slideBackground();
      this._$content = this.$el.find('.content');
      this._$content.addClass(bg);

      this._impScaleChanged();

      return this;
    },
    __getTemplate: function() {
      return JST["strut.slide_snapshot/TransitionSlideSnapshot"];
    },
    constructor: function TransitionSlideSnapshot() {
			ThreeDComponentView.prototype.constructor.apply(this, arguments);
		}
  });
});
