/*
@author Matt Crinklaw-Vogt
*/
define(["model/geom/SpatialObject"], function(SpatialObject) {
  return SpatialObject.extend({
    initialize: function() {
      this.set("components", []);
      return this.on("unrender", this._unrendered, this);
    },
    _unrendered: function() {
      return this.get("components").forEach(function(component) {
        return component.trigger("unrender", true);
      });
    },
    add: function(component) {
      this.attributes.components.push(component);
      component.on("dispose", this.remove, this);
      component.on("change:selected", this.selectionChanged, this);
      component.on("change", this.componentChanged, this);
      this.trigger("change");
      return this.trigger("change:components.add", this, component);
    },
    remove: function(component) {
      var idx;
      idx = this.attributes.components.indexOf(component);
      if (idx !== -1) {
        this.attributes.components.splice(idx, 1);
        this.trigger("change");
        return this.trigger("change:components.remove", this, component);
      }
    },
    componentChanged: function() {
      return this.trigger("change");
    },
    unselectComponents: function() {
      if (this._lastSelection) return this._lastSelection.set("selected", false);
    },
    selectionChanged: function(model, selected) {
      if (selected) {
        this.trigger("change:activeComponent", this, model, selected);
        if (this._lastSelection !== model) {
          this.attributes.components.forEach(function(component) {
            if (component !== model) return component.set("selected", false);
          });
          return this._lastSelection = model;
        }
      } else {
        this.trigger("change:activeComponent", this, null);
        return this._lastSelection = null;
      }
    }
  });
});
