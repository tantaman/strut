define(['libs/backbone'], function(Backbone) {
  'use strict';
    
  var models = {},
    views = {},
    collections = {},
    etch = {};
	
  // versioning as per semver.org
  etch.VERSION = '0.6.2';

  etch.config = {
    // selector to specify editable elements   
    selector: '.editable',
      
    // Named sets of buttons to be specified on the editable element
    // in the markup as "data-button-class"   
    buttonClasses: {
      'default': ['save'],
      'all': ['bold', 'italic', 'underline', 'unordered-list', 'ordered-list', 'link', 'clear-formatting', 'save'],
      'title': ['bold', 'italic', 'underline', 'save']
    }
  };

  function extractValue(e){
      var value = e.target.dataset.value;
      if (value == null) {
        $target = $(e.target);
        value = $target.parent()[0].dataset.value;
      }
      return value;
  }

  models.Editor = Backbone.Model.extend({
    constructor: function EtchEditorModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });

  views.Editor = Backbone.View.extend({
    constructor: function EtchEditorView() {
      Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function() {
      this.$el = $(this.el);
            
      // Model attribute event listeners:
      _.bindAll(this, 'changeButtons', 'changePosition', 'changeEditable', 'insertImage',
              '_editableModelChanged');
      this.model.bind('change:buttons', this.changeButtons, this);
      this.model.bind('change:position', this.changePosition, this);
      this.model.bind('change:editable', this.changeEditable, this);
      this.model.bind('caretUpdated', this._caretUpdated, this);
      this.model.bind('spectrum:hide', this._hideSpectrum, this);

      this.model.on('change:editableModel', this._editableModelChanged, this);

      this._editableModelChanged(this.model, this.model.get('editableModel'));
      // Init Routines:
      this.changeEditable();
    },

    events: {
      'click .etch-bold': 'toggleBold',
      'click .etch-italic': 'toggleItalic',
      'click .etch-underline': 'toggleUnderline',
      'click .etch-heading': 'toggleHeading',
      'click .etch-unordered-list': 'toggleUnorderedList',
      'click .etch-justify-left': 'justifyLeft',
      'click .etch-justify-center': 'justifyCenter',
      'click .etch-justify-right': 'justifyRight',
      'click .etch-ordered-list': 'toggleOrderedList',
      'click .etch-link': 'toggleLink',
      'click .etch-image': 'getImage',
      'click .etch-save': 'save',
      'click .etch-clear-formatting': 'clearFormatting',
      'click [data-option="fontSize"]': 'setFontSize',
      'click [data-option="fontFamily"]': 'setFontFamily'
    },

    _editableModelChanged: function(model, newEditable) {
      if (this._lastEditableModel != null) {
        this._lastEditableModel.off(null, null, this);
      }

      this._lastEditableModel = newEditable;
      
      newEditable.on('change:size', this._fontSizeChanged, this);
    },

    _hideSpectrum: function() {
      this.$colorChooser.spectrum('hide');
    },

    _caretUpdated: function() {
      var $container = $(getSelectionBoundaryElement(window));
      var color = $container.attr('color');
      var face = $container.attr('face');

      color = color || $container.parents('font').attr('color') || '#333';
      face = face || $container.parents('font').attr('face') || 'Lato';

      if (face)
        face = face.split(',')[0]

      this.$fontFamilyReadout.html(face);
      this.$colorChooser.spectrum('set', color);
    },
        
    changeEditable: function() {
      this.setButtonClass();
      // Im assuming that Ill add more functionality here
    },

    setButtonClass: function() {
      // check the button class of the element being edited and set the associated buttons on the model
      var editorModel = this.model;
      var buttonClass = editorModel.get('editable').attr('data-button-class') || 'default';
      editorModel.set({ buttons: etch.config.buttonClasses[buttonClass] });
    },

    _fontSizeChanged: function(model, value) {
      this.$fontSizeReadout.text(value);
    },

    changeButtons: function() {
      console.log("Change btns");
      // render the buttons into the editor-panel
      this.$el.empty();
      var view = this;
      var buttons = this.model.get('buttons');
            
      // hide editor panel if there are no buttons in it and exit early
      if (!buttons.length) { $(this.el).hide(); return; }
      
      var $container = view.$el;  
      _.each(this.model.get('buttons'), function(button){
        if (button == "<group>") {
          $container = etch.groupElFactory();
          view.$el.append($container);
        } else if (button == "</group>") {
          $container = view.$el;
        } else {
          var $buttonEl = etch.buttonElFactory(button);
          $container.append($buttonEl);
        }
      });
            
      $(this.el).show('fast');

      var $colorChooser = this.$el.find(".color-chooser");
      if ($colorChooser.length > 0) {
        var hex = '333';
        $colorChooser.spectrum({
          color: '#' + hex,
          showSelectionPalette: true,
          localStorageKey: 'strut.colorChooser',
          showPalette: true,
          showInitial: true,
          showInput: true,
          palette: [],
          clickoutFiresChange: true,
          theme: 'sp-dark',
          move: function (color) {
            // $colorChooser.find("div").css("backgroundColor", "#" + hex);
            //view.model.get('editableModel').set('color', hex)
            document.execCommand('foreColor', false, color.toHexString());
          },
          change: function(color) {
            Backbone.trigger('etch:state', {
              color: color.toHexString()
            });
          }
        });

        var prevent = function(e) {
          e.preventDefault();
        };

        $(".sp-replacer").mousedown(prevent);
        $(".sp-container").mousedown(prevent);
        $colorChooser.mousedown(prevent);

        $colorChooser.find("div").css("backgroundColor", '#' + hex)
      }

      var $toggle = this.$el.find('.dropdown-toggle');
      $toggle.dropdown();
      this.$fontSizeReadout = this.$el.find('.fontSizeReadout');
      this.$colorChooser = $colorChooser;
      this.$fontFamilyReadout = this.$el.find('.fontFamilyBtn > .text');
    },

    changePosition: function() {
      // animate editor-panel to new position
      var pos = this.model.get('position');
      this.$el.animate({'top': pos.y, 'left': pos.x}, { queue: false, duration: 300 });
    },
        
    wrapSelection: function(selectionOrRange, elString, cb) {
      // wrap current selection with elString tag
      var range = selectionOrRange === Range ? selectionOrRange : selectionOrRange.getRangeAt(0);
      var el = document.createElement(elString);
      range.surroundContents(el);
    },
        
    clearFormatting: function(e) {
      e.preventDefault();
      document.execCommand('removeFormat', false, null);
    },

    setFontFamily: function(e) {
      e.preventDefault();
      var value = extractValue(e);
      document.execCommand('fontName', false, value);
      value = value.substr(value.indexOf("'")+1, value.lastIndexOf("'")-1)
      this.$el.find(".fontFamilyBtn .text").text(value);
      Backbone.trigger('etch:state', {
        face: value
      });
    },

    setFontSize: function(e) {
      var textBox = this.model.get('editableModel');
      var value = extractValue(e);

      textBox.set('size', (value |= 0));

      // TODO: we need to bind this to the editable model...
      // whenever that changes.
      // so that way we have the correct font readouts when someone
      // uses the scale control
      this.$el.find(".fontSizeBtn .text").text(value);
      Backbone.trigger('etch:state', {
        size: value
      });
    },
        
    toggleBold: function(e) {
      e.preventDefault();
      document.execCommand('bold', false, null);
    },

    toggleItalic: function(e) {
      e.preventDefault();
      document.execCommand('italic', false, null);
    },

    toggleUnderline: function(e) {
      e.preventDefault();
      document.execCommand('underline', false, null);
    },
        
    toggleHeading: function(e) {
      e.preventDefault();
      var range = window.getSelection().getRangeAt(0);
      var wrapper = range.commonAncestorContainer.parentElement
      if ($(wrapper).is('h3')) {
        $(wrapper).replaceWith(wrapper.textContent)
        return;
      }
      var h3 = document.createElement('h3');
      range.surroundContents(h3);
    },

    urlPrompt: function(callback) {
      // This uses the default browser UI prompt to get a url.
      // Override this function if you want to implement a custom UI.
        
      var url = prompt('Enter a url', 'http://');
        
      // Ensure a new link URL starts with http:// or https:// 
      // before it's added to the DOM.
      //
      // NOTE: This implementation will disallow relative URLs from being added
      // but will make it easier for users typing external URLs.
      if (/^((http|https)...)/.test(url)) {
        callback(url);
      } else {
        callback("http://" + url);
      }
    },
    
    toggleLink: function(e) {
      e.preventDefault();
      var range = window.getSelection().getRangeAt(0);

      // are we in an anchor element?
      if (range.startContainer.parentNode.tagName === 'A' || range.endContainer.parentNode.tagName === 'A') {
        // unlink anchor
        document.execCommand('unlink', false, null);
      } else {
        // promt for url and create link
        this.urlPrompt(function(url) {
          document.execCommand('createLink', false, url);
          // sets the link to new tab / window
          // needs to get the range from fresh since the tree changed
          window.getSelection().getRangeAt(0).startContainer.parentNode.setAttribute('target','_blank');
        });
      }
    },

    toggleUnorderedList: function(e) {
      e.preventDefault();
      document.execCommand('insertUnorderedList', false, null);
    },

    toggleOrderedList: function(e){
      e.preventDefault();
      document.execCommand('insertOrderedList', false, null);
    },
        
    justifyLeft: function(e) {
      e.preventDefault();
      document.execCommand('justifyLeft', false, null);
    },

    justifyCenter: function(e) {
      e.preventDefault();
      document.execCommand('justifyCenter', false, null);
    },

    justifyRight: function(e) {
      e.preventDefault();
      document.execCommand('justifyRight', false, null);
    },

    getImage: function(e) {
      e.preventDefault();

      // call startUploader with callback to handle inserting it once it is uploded/cropped
      this.startUploader(this.insertImage);
    },
        
    startUploader: function(cb) {
      // initialize Image Uploader
      var model = new models.ImageUploader();
      var view = new views.ImageUploader({model: model});
            
      // stash a reference to the callback to be called after image is uploaded
      model._imageCallback = function(image) {
        view.startCropper(image, cb);
      };


      // stash reference to saved range for inserting the image once its 
      this._savedRange = window.getSelection().getRangeAt(0);

      // insert uploader html into DOM
      $('body').append(view.render().el);
    },
        
    insertImage: function(image) {
      // insert image - passed as a callback to startUploader
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(this._savedRange);
            
      var attrs = {
        'editable': this.model.get('editable'),
        'editableModel': this.model.get('editableModel')
      };
            
      _.extend(attrs, image);

      var model = new models.EditableImage(attrs);
      var view = new views.EditableImage({model: model});
      this._savedRange.insertNode($(view.render().el).addClass('etch-float-left')[0]);
    },
        
    save: function(e) {
      e.preventDefault();
      var editableModel = this.model.get('editableModel');
      editableModel.trigger('save');
    }
  });

  // tack on models, views, etc... as well as init function
  _.extend(etch, {
    models: models,
    views: views,
    collections: collections,

    triggerCaret: function() {
      var editorModel = $('.etch-editor-panel').data('model');
      editorModel.trigger('caretUpdated');
    },

    // This function is to be used as callback to whatever event
    // you use to initialize editing 
    editableInit: function(e, overrideY) {
      e.stopPropagation();
      var target = e.target || e.srcElement;
      var $editable = $(target).etchFindEditable();
      //$editable.attr('contenteditable', true);

      // if the editor isn't already built, build it
      var $editor = $('.etch-editor-panel');
      var editorModel = $editor.data('model');
      if (!$editor.size()) {
        $editor = $('<div class="etch-editor-panel">');
        var editorAttrs = { editable: $editable, editableModel: this.model };
        document.body.appendChild($editor[0]);
        $editor.etchInstantiate({classType: 'Editor', attrs: editorAttrs});
        editorModel = $editor.data('model');

      // check if we are on a new editable
      } else if ($editable[0] !== editorModel.get('editable')[0]) {
        // set new editable
        editorModel.set({
          editable: $editable,
          editableModel: this.model
        });
        $editor.css("display", "block");
      } else {
        $editor.css("display", "block");
      }
      
      // Firefox seems to be only browser that defaults to `StyleWithCSS == true`
      // so we turn it off here. Plus a try..catch to avoid an error being thrown in IE8.
      try {
        document.execCommand('StyleWithCSS', false, false);
      }
      catch (err) {
        // expecting to just eat IE8 error, but if different error, rethrow
        if (err.message !== "Invalid argument.") {
          // console.log(err);
        }
      }

      if (models.EditableImage) {
        // instantiate any images that may be in the editable
        var $imgs = $editable.find('img');
        if ($imgs.size()) {
          var attrs = { editable: $editable, editableModel: this.model };
          $imgs.each(function() {
            var $this = $(this);
            if (!$this.data('editableImageModel')) {
              var editableImageModel =  new models.EditableImage(attrs);
              var editableImageView = new views.EditableImage({model: editableImageModel, el: this, tagName: this.tagName});
              $this.data('editableImageModel', editableImageModel);
            }
          });
        }
      }

      // listen for mousedowns that are not coming from the editor
      // and close the editor
      var _this = this;
      $('body').bind('mousedown.editor', function(e) {
        // check to see if the click was in an etch tool
        var target = e.target || e.srcElement;
        if ($(target).not('.sp-container *, .colorpicker *, .etch-editor-panel, .etch-editor-panel *, .etch-image-tools, .etch-image-tools *').size()) {
          // remove editor
          $editor.css("display", "none");
          editorModel.trigger('spectrum:hide', null);
          //$editor.remove();
                    
                    
          if (models.EditableImage) {
            // unblind the image-tools if the editor isn't active
            $editable.find('img').unbind('mouseenter');

            // remove any latent image tool model references
            $(etch.config.selector+' img').data('editableImageModel', false)
          }
                    
          // once the editor is removed, remove the body binding for it
          $(this).unbind('mousedown.editor');
        }
      });

      this.model.trigger('change:size', this.model, this.model.get('size'), {});
      editorModel.set({position: {x: e.pageX - 15, y: overrideY || (e.pageY - 80)}});
    }
  });

  // jquery helper functions
  $.fn.etchInstantiate = function(options, cb) {
    return this.each(function() {
      var $el = $(this);
      options || (options = {});

      var settings = {
        el: this,
        attrs: {}
      }

      _.extend(settings, options);

      var model = new models[settings.classType](settings.attrs, settings);

      // initialize a view is there is one
      if (_.isFunction(views[settings.classType])) {
        var view = new views[settings.classType]({model: model, el: this, tagName: this.tagName});
      }
           
      // stash the model and view on the elements data object
      $el.data({model: model});
      $el.data({view: view});

      if (_.isFunction(cb)) {
        cb({model: model, view: view});
      }
    });
  }

  // TODO: how do we really want to do this?
  // Allow a template to be provided?
  // Construct based on some options object?
  etch.buttonElFactory = function(button) {
      return $('<a href="#" class="etch-editor-button etch-'+ button +'" title="'+ button.replace('-', ' ') +'"><span></span></a>');
  };

  $.fn.etchFindEditable = function() {
    // function that looks for the editable selector on itself or its parents
    // and returns that el when it is found
    var $el = $(this);
    return $el.is(etch.config.selector) ? $el : $el.closest(etch.config.selector);
  }
    
  return etch;
});
