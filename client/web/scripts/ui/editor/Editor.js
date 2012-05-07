/*
@author Matt Crinklaw-Vogt
*/
define(["vendor/backbone", "./SlideEditor", "./TransitionEditor", "./Templates", "css!./res/css/Editor.css"], function(Backbone, SlideEditor, TransitionEditor, Templates, empty) {
  var editorId, menuOptions;
  editorId = 0;
  menuOptions = {
    "new": function(e) {},
    open: function(e) {},
    openRecent: function(e) {},
    save: function(e) {},
    saveAs: function(e) {},
    undo: function(e) {
      return this.model.undo();
    },
    redo: function(e) {
      return this.model.redo();
    },
    cut: function(e) {},
    copy: function(e) {},
    paste: function(e) {},
    transitionEditor: function(e) {
      return this.changePerspective(e, {
        perspective: "transitionEditor"
      });
    },
    slideEditor: function(e) {
      return this.changePerspective(e, {
        perspective: "slideEditor"
      });
    }
  };
  return Backbone.View.extend({
    className: "editor",
    events: {
      "click .menuBar .dropdown-menu > li": "menuItemSelected",
      "changePerspective": "changePerspective"
    },
    initialize: function() {
      this.id = editorId++;
      this.perspectives = {
        slideEditor: new SlideEditor({
          model: this.model
        }),
        transitionEditor: new TransitionEditor({
          model: this.model
        })
      };
      this.activePerspective = "slideEditor";
      return this.model.undoHistory.on("updated", this.undoHistoryChanged, this);
    },
    undoHistoryChanged: function() {
      var $lbl, redoName, undoName;
      undoName = this.model.undoHistory.undoName();
      redoName = this.model.undoHistory.redoName();
      if (undoName !== "") {
        $lbl = this.$el.find(".undoName");
        $lbl.text(undoName);
        $lbl.removeClass("disp-none");
      } else {
        this.$el.find(".undoName").addClass("disp-none");
      }
      if (redoName !== "") {
        $lbl = this.$el.find(".redoName");
        $lbl.text(redoName);
        return $lbl.removeClass("disp-none");
      } else {
        return this.$el.find(".redoName").addClass("disp-none");
      }
    },
    changePerspective: function(e, data) {
      var _this = this;
      this.activePerspective = data.perspective;
      return _.each(this.perspectives, function(perspective, key) {
        if (key === _this.activePerspective) {
          return perspective.show();
        } else {
          return perspective.hide();
        }
      });
    },
    menuItemSelected: function(e) {
      var $target, option;
      $target = $(e.currentTarget);
      option = $target.attr("data-option");
      return menuOptions[option].call(this, e);
    },
    render: function() {
      var $perspectivesContainer, perspectives,
        _this = this;
      perspectives = _.map(this.perspectives, function(perspective, key) {
        return {
          perspective: key,
          name: perspective.name
        };
      });
      this.$el.html(Templates.Editor({
        id: this.id,
        perspectives: perspectives
      }));
      this.$el.find(".dropdown-toggle").dropdown();
      $perspectivesContainer = this.$el.find(".perspectives-container");
      _.each(this.perspectives, function(perspective, key) {
        $perspectivesContainer.append(perspective.render());
        if (key === _this.activePerspective) return perspective.show();
      });
      this.undoHistoryChanged();
      return this.$el;
    }
  });
});
