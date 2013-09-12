/*
@author Matt Crinklaw-Vogt
*/
define(["strut/slide_components/view/ThreeDRotatableComponentView",
        "./SlideDrawer",
        "css!styles/transition_editor/TransitionSlideSnapshot.css",
        "strut/deck/Utils"],
function(ThreeDComponentView, SlideDrawer, empty, DeckUtils) {
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

      var size = {
        width: width,
        height: height
      };
      $content.css(size);
      this.slideDrawer.setSize(size);
    },

    _backgroundChanged: function(deck, bg) {
     bg = DeckUtils.slideBackground(this.model, this.options.deck, true);
     this._$content.removeClass();
     this._$content.addClass('content ' + bg);
    },

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
      var bg = DeckUtils.slideBackground(this.model, this.options.deck, true);
      this._$content = this.$el.find('.content');
      this._$content.addClass(bg);

      var $el = this.$el.find('.drawer');
      this.slideDrawer = new SlideDrawer(this.model, $el);
      
      this._impScaleChanged();

      this.slideDrawer.render();

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
