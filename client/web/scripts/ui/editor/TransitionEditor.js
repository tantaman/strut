/*
@author Matt Crinklaw-Vogt
*/
define(["vendor/backbone", "./TransitionSlideSnapshot", "./Templates", "css!./res/css/TransitionEditor.css"], function(Backbone, TransitionSlideSnapshot, Templates, empty) {
  return Backbone.View.extend({
    className: "transitionEditor",
    events: {
      "click": "clicked",
      "click *[data-option]": "buttonChosen"
    },
    scale: 1000 / 150,
    initialize: function() {
      this.name = "Transition Editor";
      return this._snapshots = [];
    },
    show: function() {
      this.$el.removeClass("disp-none");
      return this._partialRender();
    },
    hide: function() {
      this._disposeOldView();
      return this.$el.addClass("disp-none");
    },
    clicked: function() {
      return this.model.get("slides").forEach(function(slide) {
        if (slide.get("selected")) return slide.set("selected", false);
      });
    },
    buttonChosen: function(e) {
      var option;
      option = $(e.currentTarget).attr("data-option");
      switch (option) {
        case "slideEditor":
          return this.$el.trigger("changePerspective", {
            perspective: "slideEditor"
          });
        case "preview":
          return console.log("Preview...");
      }
    },
    _disposeOldView: function() {
      this._snapshots.forEach(function(snapshot) {
        return snapshot.remove();
      });
      return this._snapshots = [];
    },
    render: function() {
      this.$el.html(Templates.TransitionEditor());
      this._partialRender();
      return this.$el;
    },
    _partialRender: function() {
      var $container, slides,
        _this = this;
      $container = this.$el.find(".transitionSlides");
      $container.html("");
      slides = this.model.get("slides");
      return slides.each(function(slide) {
        var snapshot, x;
        x = slide.get("x");
        if (!(x != null)) {
          slide.set("x", Math.random() * Math.min(window.innerWidth, 1000));
          slide.set("y", Math.random() * Math.min(window.innerHeight, 700) + 80);
        }
        snapshot = new TransitionSlideSnapshot({
          model: slide
        });
        _this._snapshots.push(snapshot);
        return $container.append(snapshot.render());
      });
    }
  });
});
