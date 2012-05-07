/*
@author Matt Crinklaw-Vogt
*/
define(["vendor/backbone", "./TransitionSlideSnapshot", "css!./res/css/TransitionEditor.css"], function(Backbone, TransitionSlideSnapshot, empty) {
  return Backbone.View.extend({
    className: "transitionEditor",
    scale: 1000 / 250,
    initialize: function() {
      this.name = "Transition Editor";
      return this._snapshots = [];
    },
    show: function() {
      this.$el.removeClass("disp-none");
      return this.render();
    },
    hide: function() {
      this._disposeOldView();
      return this.$el.addClass("disp-none");
    },
    _disposeOldView: function() {
      this._snapshots.forEach(function(snapshot) {
        return snapshot.remove();
      });
      return this._snapshots = [];
    },
    render: function() {
      var slides,
        _this = this;
      this.$el.html("");
      slides = this.model.get("slides");
      slides.each(function(slide) {
        var snapshot, x;
        x = slide.get("x");
        if (!(x != null)) {
          slide.set("x", Math.random() * window.innerWidth);
          slide.set("y", Math.random() * window.innerHeight + 80);
        }
        snapshot = new TransitionSlideSnapshot({
          model: slide
        });
        _this._snapshots.push(snapshot);
        return _this.$el.append(snapshot.render());
      });
      return this.$el;
    }
  });
});
