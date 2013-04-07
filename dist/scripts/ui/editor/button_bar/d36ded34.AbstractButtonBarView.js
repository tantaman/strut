(function() {

  define(["backbone"], function(Backbone) {
    return Backbone.View.extend({
      initialize: function(callbacks) {
        return this.buttonBarOptions = callbacks;
      },
      optionChosen: function(e) {
        var option;
        option = $(e.currentTarget).attr("data-option");
        return this.buttonBarOptions[option].call(this, e);
      }
    });
  });

}).call(this);
