(function() {

  define(['backbone'], function(Backbone) {
    return Backbone.View.extend({
      className: 'disp-none',
      events: {
        "change input[type='file']": '_fileChosen'
      },
      initialize: function(triggerElem, cb) {
        this._cb = cb;
        if (triggerElem != null) {
          return triggerElem.on('click', this.trigger.bind(this));
        }
      },
      trigger: function(cb) {
        if (cb != null) {
          this._cb = cb;
        }
        return this.$input.click();
      },
      _fileChosen: function(e) {
        var f;
        f = e.target.files[0];
        return this._cb(f);
      },
      render: function() {
        this.$input = $('<input type="file"></input>');
        return this.$el.html(this.$input);
      }
    });
  });

}).call(this);
