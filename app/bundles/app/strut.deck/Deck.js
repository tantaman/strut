/**
* @module model.presentation
* @author Matt Crinklaw-Vogt
*/
define(["common/Calcium",
        "./SlideCollection",
        "./SlideCommands",
        'tantaman/web/undo_support/CmdListFactory'],
function(Backbone, SlideCollection, SlideCommands, CmdListFactory) {
    /**
        This represents a slide deck.  It has a title, a currently active
        slide, a collection of slides, the filename on "disk" and
        the overarching presentation background color.
        @class model.presentation.Deck
    */
    return Backbone.Model.extend({
      initialize: function() {
        var slides;
        this.undoHistory = CmdListFactory.managedInstance('editor');
        this.set("slides", new SlideCollection());
        slides = this.get("slides");
        slides.on("add", this._slideAdded, this);
        slides.on("remove", this._slideRemoved, this);
        slides.on("reset", this._slidesReset, this);
        return this._lastSelected = undefined;
      },
      /**
            Creates a new slide and adds it as the last slide in the deck.
            The newly created slide is set as the active slide in the deck.
            @method newSlide
            *
      */

      newSlide: function(index) {
        var createCmd, slide;
        createCmd = new SlideCommands.Create(this, index);
        slide = createCmd["do"]();
        this.undoHistory.push(createCmd);
        return slide;
      },
      set: function(key, value) {
        if (key === "activeSlide") {
          this._activeSlideChanging(value);
        }
        return Backbone.Model.prototype.set.apply(this, arguments);
      },

      // TODO: this should be a command so we can undo it
      moveSlide: function(sourceIndex, destIndex) {
        var slides = this.get('slides');
        var slide = slides.at(sourceIndex);
        slides.remove(slide, {silent: true});
        slides.add(slide, {at: destIndex, silent: true});
      },

      // resortSlides: function(sourceIndex, destIndex) {
      //   var slides = this.get('slides');
        
      //   for (var i = 0; i < slides.models.length; ++i) {
      //     if (sourceIndex < destIndex) {
      //       if (i <= destIndex && i > sourceIndex) {
      //         slides.models[i].set('num', i-1);
      //       }
      //       if (i == sourceIndex) {
      //         slides.models[i].set('num', destIndex);
      //       }
      //     } else if (destIndex < sourceIndex) {
      //       if (i >= destIndex && i < sourceIndex) {
      //         slides.models[i].set('num', i + 1);
      //       }
      //       if (i == sourceIndex) {
      //         slides.models[i].set('num', destIndex);
      //       }
      //     }
      //   }

      //   slides.sort();
      // },

      /**
            Method to import an existing presentation into this deck.
            TODO: this method should be a bit less brittle.  If new properties are added
            to a deck, this won't set them.
            @method import
            @param {Object} rawObj the "json" representation of a deck
            *
      */

      "import": function(rawObj) {
        var activeSlide, slides;
        slides = this.get("slides");
        activeSlide = this.get("activeSlide");
        if (activeSlide !== undefined) {
          activeSlide.unselectComponents();
        }
        this.set("activeSlide", undefined);
        this.set("background", rawObj.background);
        this.set("fileName", rawObj.fileName);
        this.undoHistory.clear();

        // TODO: go through and dispose of all old slides...?

        return slides.reset(rawObj.slides);
      },
      _activeSlideChanging: function(newActive) {
        var lastActive;
        lastActive = this.get("activeSlide");
        if (newActive === lastActive) {
          return undefined;
        }
        if (lastActive !== undefined) {
          lastActive.unselectComponents();
          lastActive.set({
            active: false,
            selected: false
          });
        }
        if (newActive !== undefined) {
          return newActive.set({
            selected: true,
            active: true
          });
        }
      },
      _slideAdded: function(slide, collection, options) {
        this.set("activeSlide", slide);
        this.trigger("slideAdded", slide, options.index);
        return this._registerWithSlide(slide);
      },
      _slideDisposed: function(slide) {
        return slide.off(null, null, this);
      },
      _slideRemoved: function(slide, collection, options) {
        console.log("Slide removed");
        if (this.get("activeSlide") === slide) {
          if (options.index < collection.length) {
            this.set("activeSlide", collection.at(options.index));
          } else if (options.index > 0) {
            this.set("activeSlide", collection.at(options.index - 1));
          } else {
            this.set("activeSlide", undefined);
          }
        }
        return slide.dispose();
      },
      _slidesReset: function(newSlides, options, oldSlides) {
        var _this = this;
        oldSlides.forEach(function(slide) {
          return slide.dispose();
        });
        this.trigger('slidesReset', newSlides);
        return newSlides.forEach(function(slide) {
          _this._registerWithSlide(slide);
          if (slide.get("active")) {
            return slide.trigger("change:active", slide, true);
          } else if (slide.get("selected")) {
            return slide.set("selected", false);
          }
        });
      },
      _slideActivated: function(slide, value) {
        if (value) {
          return this.set("activeSlide", slide);
        }
      },
      _slideSelected: function(slide, value) {
        if ((this._lastSelected !== undefined) && value && this._lastSelected !== slide) {
          this._lastSelected.set("selected", false);
        }
        return this._lastSelected = slide;
      },
      _registerWithSlide: function(slide) {
        slide.on("change:active", this._slideActivated, this);
        slide.on("change:selected", this._slideSelected, this);
        return slide.on("dispose", this._slideDisposed, this);
      },
      /**
            Removes the specified slide from the deck
            @method removeSlide
            @param {model.presentation.Slide} slide the slide to remove.
            *
      */

      removeSlide: function(slide) {
        this.undoHistory.pushdo(new SlideCommands.Remove(this, slide));
        return slide;
      },
      addSlide: function(slide) {
        return this.get("slides").add(slide);
      },
      undo: function() {
        return this.undoHistory.undo();
      },
      redo: function() {
        return this.undoHistory.redo();
      }
    });
  });
