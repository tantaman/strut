define(['libs/backbone',
		'css!styles/slide_editor/operatingTable.css',
		'strut/slide_components/ComponentFactory',
		'strut/editor/GlobalEvents',
		'strut/deck/Component'],
function(Backbone, empty, ComponentFactory, GlobalEvents, Component) {
	'use strict';
	return Backbone.View.extend({
		className: 'operatingTable',
		events: {
        	"click": "_clicked",
        	"focused": "_focus",
        	"dragover": "_dragover",
        	"drop": "_drop",
        	destroyed: 'dispose'
      	},

		initialize: function() {
			this._resize = this._resize.bind(this);
			$(window).resize(this._resize);

			// Re-render when active slide changes in the deck
			this._deck.on('change:activeSlide', function(deck, model) {
        		this.setModel(model);
      		}, this);
      		this._deck.on('change:background', this._updateBg, this);
			this.setModel(this._deck.get('activeSlide'));

			GlobalEvents.on('cut', this._cut, this);
			GlobalEvents.on('copy', this._copy, this);
			GlobalEvents.on('paste', this._paste, this);

			this._clipboard = this._editorModel.clipboard;
		},

		render: function() {
			this._$slideContainer = $('<div class="slideContainer"></div>')
			this.$el.html(this._$slideContainer);
			this._$slideContainer.css(config.slide.size);

			this._$slideContainer.addClass(this._deck.get('background') || 'defaultbg');
			this._$slideContainer.data('background', this._deck.get('background') || 'defaultbg');

			var self = this;
			setTimeout(function() {
				self._rendered = true;
				self._resize();
				self._renderContents();
			});

			return this;
		},

		_updateBg: function(model, bg) {
			this._$slideContainer.removeClass();
			this._$slideContainer.addClass('slideContainer ' + bg);
			this._$slideContainer.data('background', bg);
		},

		// TODO: make the cut/copy/paste interfaces identical for
		// slides and slide components so we can mix this code into both?
		_cut: function() {
			if (this._editorModel.get('scope') == 'operatingTable') {
				var comp = this.model.lastSelection;
				if (comp) {
					this.model.remove(comp);
					this._clipboard.item = comp.clone();
					comp.dispose();
				}
			}
		},

		_copy: function() {
			if (this._editorModel.get('scope') == 'operatingTable') {
				var comp = this.model.lastSelection;
				if (comp) {
					this._clipboard.item = comp;
				}
			}
		},

		_paste: function() {
			var item = this._clipboard.item;
			if (item != null && item instanceof Component) {
				var comp = item.clone();
				comp.set({
					selected: false,
					active: false
				});
				this.model.add(comp);
			}
		},

		_clicked: function() {
			this._focus();
			this.model.get('components').forEach(function(comp) {
				if (comp.get('selected')) {
					comp.set('selected', false);
				}
			});
			this.$el.find('.editable').removeClass('editable').attr('contenteditable', false)
				.trigger('editComplete');

			this._focus();
		},

		_focus: function() {
			this._editorModel.set('scope', 'operatingTable');
		},

		_dragover: function(e) {
			e.stopPropagation()
			e.preventDefault()
			e.originalEvent.dataTransfer.dropEffect = 'copy'
		},

		_drop: function(e) {
			e.stopPropagation()
			e.preventDefault()
			var f = e.originalEvent.dataTransfer.files[0]

			if (!f.type.match('image.*'))
				return

			var reader = new FileReader()
			var self = this;
			reader.onload = function(e) {
				self.model.add(
					ComponentFactory.instance.createModel({
						type: 'Image',
						src: e.target.result
				}));
			};

			reader.readAsDataURL(f)
		},

		_componentAdded: function(model, comp) {
			var view = ComponentFactory.instance.createView(comp);
			this._$slideContainer.append(view.render());
		},

		setModel: function(model) {
			var prevModel = this.model;
			if (this.model === model) return;

			if (this.model != null) {
				this.model.off(null, null, this);
			}
			this.model = model;
			if (this.model != null) {
				this.model.on('change:components.add', this._componentAdded, this);
			}
			this._renderContents(prevModel);
			return this;
		},

		dispose: function() {
			$(window).off('resize', this._resize);
			this._deck.off(null, null, this);
			if (this.model)
				this.model.off(null, null, this);
			GlobalEvents.off(null, null, this);
		},

		_renderContents: function(prevModel) {
			if (prevModel != null) {
				prevModel.trigger('unrender', true);
			}

			if (!this._rendered) return;

			if (this.model != null) {
				var components = this.model.get('components');
				components.forEach(function(comp) {
					var view = ComponentFactory.instance.createView(comp);
					this._$slideContainer.append(view.render());
				}, this);
			}
		},

		_resize: function() {
			var width = this.$el.width();
			var height = this.$el.height();

			var slideSize = config.slide.size;

			var xScale = width / slideSize.width;
			var yScale = (height - 20) / slideSize.height;

			var newHeight = slideSize.height * xScale;
			if (newHeight > height) {
				var scale = yScale;
			} else {
				var scale = xScale;
			}

			var scaledWidth = scale * slideSize.width;

			var remainingWidth = width - scaledWidth;

			this._$slideContainer.css({
				'margin-left': remainingWidth / 2,
				'margin-right': remainingWidth / 2
			});

			this._$slideContainer.css(window.browserPrefix + 'transform', 'scale(' + scale + ')')
		},

		constructor: function OperatingTable(editorModel) {
			this._deck = editorModel.deck();
			this._registry = editorModel.registry;
			this._editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
