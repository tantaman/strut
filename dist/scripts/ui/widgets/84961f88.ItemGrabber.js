
/*
@author Matt Crinklaw-Vogt
*/


(function() {

  define(["backbone", "common/Throttler"], function(Backbone, Throttler) {
    return Backbone.View.extend({
      className: "itemGrabber modal",
      events: {
        "click .ok": "okClicked",
        "click div[data-option='browse']": "browseClicked",
        "change input[type='file']": "fileChosen",
        "keyup input[name='itemUrl']": "urlChanged",
        "paste input[name='itemUrl']": "urlChanged",
        "hidden": "hidden"
      },
      initialize: function() {
        return this.throttler = new Throttler(200, this);
      },
      show: function(cb) {
        this.cb = cb;
        return this.$el.modal('show');
      },
      okClicked: function() {
        if (!this.$el.find(".ok").hasClass("disabled")) {
          this.cb(this.src);
          return this.$el.modal('hide');
        }
      },
      fileChosen: function(e) {
        var f, reader,
          _this = this;
        f = e.target.files[0];
        if (!f.type.match('image.*')) {
          return;
        }
        reader = new FileReader();
        reader.onload = function(e) {
          _this.$input.val(e.target.result);
          return _this.urlChanged({
            which: -1
          });
        };
        return reader.readAsDataURL(f);
      },
      browseClicked: function() {
        return this.$el.find('input[type="file"]').click();
      },
      hidden: function() {
        if (this.$input != null) {
          return this.$input.val("");
        }
      },
      urlChanged: function(e) {
        if (e.which === 13) {
          this.src = this.$input.val();
          return this.okClicked();
        } else {
          return this.throttler.submit(this.loadItem, {
            rejectionPolicy: "runLast"
          });
        }
      },
      loadItem: function() {
        this.item.src = this.$input.val();
        return this.src = this.item.src;
      },
      _itemLoadError: function() {
        this.$el.find(".ok").addClass("disabled");
        return this.$el.find(".alert").removeClass("disp-none");
      },
      _itemLoaded: function() {
        this.$el.find(".ok").removeClass("disabled");
        return this.$el.find(".alert").addClass("disp-none");
      },
      render: function() {
        var _this = this;
        this.$el.html(JST["widgets/ItemGrabber"](this.options));
        this.$el.modal();
        this.$el.modal("hide");
        this.item = this.$el.find(this.options.tag)[0];
        if (this.options.tag === "video") {
          this.$el.find(".modal-body").prepend("<div class='alert alert-success'>Supports <strong>webm & YouTube</strong>.<br/>Try out: http://www.youtube.com/watch?v=vHUsdkmr-SM</div>");
        }
        if (!this.options.ignoreErrors) {
          this.item.onerror = function() {
            return _this._itemLoadError();
          };
          this.item.onload = function() {
            return _this._itemLoaded();
          };
        }
        this.$input = this.$el.find("input[name='itemUrl']");
        return this.$el;
      },
      constructor: function ItemGrabber() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
    });
  });

}).call(this);
