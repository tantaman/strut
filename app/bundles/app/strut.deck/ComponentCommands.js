 define(function() {
    var AddComponent, RemoveComponent;
    AddComponent = function(slide, component) {
      this.slide = slide;
      this.component = component;
    };
    AddComponent.prototype = {
      do: function() {
        return this.slide.__doAdd(this.component);
      },
      undo: function() {
        return this.slide.__doRemove(this.component);
      },
      name: "Add Comp"
    };
    RemoveComponent = function(slide, component) {
      this.slide = slide;
      this.component = component;
    };
    RemoveComponent.prototype = {
      "do": function() {
        return this.slide.__doRemove(this.component);
      },
      undo: function() {
        return this.slide.__doAdd(this.component);
      },
      name: "Remove Comp"
    };

    function BaseCommand(initial, model, attr, name) {
      this.start = initial;
      this.end = model.get(attr) || 0;
      this.model = model;
      this.name = name;
      this.attr = attr;
    }

    BaseCommand.prototype = {
       "do": function() {
        this.model.set(this.attr, this.end);
      },
      undo: function() {
        this.model.set(this.attr, this.start);
      }
    };

    Move = function(startLoc, model) {
      this.startLoc = startLoc;
      this.model = model;
      this.endLoc = {
        x: this.model.get("x"),
        y: this.model.get("y")
      };
      return this;
    };
    Move.prototype = {
      "do": function() {
        return this.model.set(this.endLoc);
      },
      undo: function() {
        return this.model.set(this.startLoc);
      },
      name: "Move"
    };

    return {
      Add: AddComponent,
      Remove: RemoveComponent,
      Move: Move,
      SkewX: function(initial, component) {
        return new BaseCommand(initial, component, 'skewX', 'Skew X');
      },
      SkewY: function(initial, component) {
        return new BaseCommand(initial, component, 'skewY', 'Skew Y');
      },
      Rotate: function(initial, component) {
        return new BaseCommand(initial, component, 'rotate', 'Rotate');
      },
      Scale: function(initial, component) {
        return new BaseCommand(initial || {x:1,y:1}, component, 'scale', 'Scale');
      },
      TextScale: function(initial, component) {
        return new BaseCommand(initial, component, 'size', 'Scale');
      }
    };
  });