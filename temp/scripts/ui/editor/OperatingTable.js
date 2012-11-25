
/*
@author Matt Crinklaw-Vogt
*/


(function() {

  define(["backbone", "./components/ComponentViewFactory", "libs/keymaster", "ui/interactions/CutCopyPasteBindings", "model/system/Clipboard", "model/presentation/components/ComponentFactory", "css!styles/editor/OperatingTable.css"], function(Backbone, ComponentViewFactory, Keymaster, CutCopyPasteBindings, Clipboard, ComponentFactory, empty) {
    return Backbone.View.extend({
      className: "operatingTable",
      events: {
        "click": "clicked",
        "focused": "_focus",
        "dragover": "_dragover",
        "drop": "_drop"
      },
      initialize: function() {
        CutCopyPasteBindings.applyTo(this, "operatingTable");
        return this._clipboard = new Clipboard();
      },
      setModel: function(slide) {
        var prevModel;
        prevModel = this.model;
        if (this.model != null) {
          this.model.off(null, null, this);
        }
        this.model = slide;
        if (this.model != null) {
          this.model.on("change:components.add", this._componentAdded, this);
        }
        return this.render(prevModel);
      },
      _dragover: function(e) {
        e.stopPropagation();
        e.preventDefault();
        return e.originalEvent.dataTransfer.dropEffect = 'copy';
      },
      _drop: function(e) {
        var f, reader,
          _this = this;
        e.stopPropagation();
        e.preventDefault();
        f = e.originalEvent.dataTransfer.files[0];
        if (!f.type.match('image.*')) {
          return;
        }
        reader = new FileReader();
        reader.onload = function(e) {
          return _this.model.add(ComponentFactory.createImage({
            src: e.target.result
          }));
        };
        return reader.readAsDataURL(f);
      },
      resized: function() {
        var newHeight, scale, slideSize, tableSize, xScale, yScale;
        slideSize = window.slideConfig.size;
        tableSize = {
          width: this.$el.width(),
          height: this.$el.height()
        };
        xScale = tableSize.width / slideSize.width;
        yScale = (tableSize.height - 20) / slideSize.height;
        newHeight = slideSize.height * xScale;
        if (newHeight > tableSize.height) {
          scale = yScale;
        } else {
          scale = xScale;
        }
        return this.$slideContainer.css(window.browserPrefix + "transform", "scale(" + scale + ")");
      },
      clicked: function(e) {
        if (this.model != null) {
          this.model.get("components").forEach(function(component) {
            if (component.get("selected")) {
              return component.set("selected", false);
            }
          });
          this.$el.find(".editable").removeClass("editable").attr("contenteditable", false).trigger("editComplete");
        }
        return this._focus();
      },
      cut: function() {
        var item;
        item = this.model.lastSelection;
        if ((item != null)) {
          this._clipboard.set("item", item);
          this.model.remove(item);
          return item.set("selected", false);
        }
      },
      copy: function() {
        var item, newItem;
        item = this.model.lastSelection;
        if ((item != null)) {
          newItem = item.clone();
          newItem.set("x", item.get("x") + 25);
          newItem.set("selected", false);
          return this._clipboard.set("item", newItem);
        }
      },
      paste: function() {
        var item;
        if (this.$el.find(".editable").length !== 0) {
          return true;
        } else {
          item = this._clipboard.get("item");
          if (item != null) {
            return this.model.add(item.clone());
          }
        }
      },
      _focus: function() {
        if (Keymaster.getScope() !== "operatingTable") {
          return Keymaster.setScope("operatingTable");
        }
      },
      _componentAdded: function(model, component) {
        var view;
        view = ComponentViewFactory.createView(component);
        return this.$slideContainer.append(view.render());
      },
      backgroundChanged: function(newBG) {
        var style, _i, _len, _ref, _results;
        _ref = newBG.styles;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          style = _ref[_i];
          _results.push(this.$slideContainer.css("background-image", style));
        }
        return _results;
      },
      render: function(prevModel) {
        var components,
          _this = this;
        if (prevModel != null) {
          prevModel.trigger("unrender", true);
        }
        this.$el.html("<div class='slideContainer'></div>");
        this.$slideContainer = this.$el.find(".slideContainer");
        this.$slideContainer.css({
          width: window.slideConfig.size.width,
          height: window.slideConfig.size.height
        });
        this.resized();
        if (this.model != null) {
          components = this.model.get("components");
          components.forEach(function(component) {
            var view;
            view = ComponentViewFactory.createView(component);
            return _this.$slideContainer.append(view.render());
          });
        }
        return this.$el;
      }
    });
  });

}).call(this);
