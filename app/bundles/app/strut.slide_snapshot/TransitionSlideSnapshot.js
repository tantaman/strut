/*
@author Matt Crinklaw-Vogt
*/
define(["strut/slide_components/view/ThreeDRotatableComponentView",
        "./SlideDrawer",
        "css!styles/transition_editor/TransitionSlideSnapshot.css"],
function(ThreeDComponentView, SlideDrawer, empty) {
  return ThreeDComponentView.extend({
    className: "component transitionSlideSnapshot",
    events: function() {
      var parentEvents;
      parentEvents = ThreeDComponentView.prototype.events();
      return _.extend(parentEvents, {
        "click": "clicked",
        'destroyed': 'dispose'
      });
    },
    initialize: function() {
      ThreeDComponentView.prototype.initialize.apply(this, arguments);
      this.model.on('change:impScale', this._impScaleChanged, this);
    },
    remove: function() {
      this.dispose();
      ThreeDComponentView.prototype.remove.call(this, true);
      this.model.set("selected", false);
    },
    dispose: function() {
      if (this.slideDrawer != null) {
        this.slideDrawer.dispose();
      }
      ThreeDComponentView.prototype.dispose.call(this);
    },
    clicked: function() {
      ThreeDComponentView.prototype.clicked.apply(this, arguments);
      this.model.set("active", true);

      this.$el.css('z-index', zTracker.next());
    },
    _impScaleChanged: function() {
      var tform = window.browserPrefix + 'transform';
      var scale = 'scale(' + this.model.get('impScale')/2 + ')';
      this.$el.css(tform, scale);
    },

    render: function() {
      var g2d;
      ThreeDComponentView.prototype.render.apply(this, arguments);
      if (this.slideDrawer != null) {
        this.slideDrawer.dispose();
      }
      g2d = this.$el.find("canvas")[0].getContext("2d");
      this.slideDrawer = new SlideDrawer(this.model, g2d, this.options.registry);
      this.slideDrawer.repaint();
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

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
