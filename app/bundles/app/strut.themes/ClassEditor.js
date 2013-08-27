define(['./Button',
		'tantaman/web/widgets/PopoverTextbox'],
function(Button, PopoverTextbox) {
	var popover = new PopoverTextbox({title: 'Classes: '});
	popover.render();

	function ClassEditor(editorModel) {
		this._button = new Button({
			icon: 'icon-plus',
			cb: this._launch.bind(this),
			name: 'Class'
		});

		this._appended = false;

		this._button.$el.addClass('iconBtns btn-grouped');
		this._button.disable();

		this._deck = editorModel.deck();
		this._popover = popover;
		var activeSlide = this._deck.get('activeSlide');
		if (activeSlide) {
			this._activeSlideChanged(this._deck, activeSlide);
		}

		this._deck.on('change:activeSlide', this._activeSlideChanged, this);
		this._classesSaved = this._classesSaved.bind(this);
	}

	ClassEditor.prototype = {
		view: function() {
			return this._button;
		},

		_activeComponentChanged: function(slide, component) {
			console.log('Active component notification');
			this._activeComponent = component;
			if (component)
				this._button.enable();
			else 
				this._button.disable();

			this._popover.hide();
		},

		_activeSlideChanged: function(deck, slide) {
			console.log('Active slide notification');
			if (this._activeSlide) {
				this._activeSlide.off(null, null, this);
			}

			this._activeSlide = slide;
			if (this._activeSlide) {
				this._activeSlide.on('change:activeComponent', this._activeComponentChanged, this);

				var comp = this._activeSlide.lastSelection;
				if (comp)
					this._activeComponentChanged(slide, comp);
			}
		},

		_launch: function() {
			if (!this._appended) {
				var $slideEditArea = $('.slideEditArea');
				$slideEditArea.append(popover.$el);
			}

			this._popover.show({
				left: this._activeComponent.get('x'),
				top: this._activeComponent.get('y')
			}, this._classesSaved);
		},

		_classesSaved: function(classes) {
			this._activeComponent.customClasses(classes);
			this._popover.hide();
		},

		dispose: function() {
			console.log('Disposing class editor');
			if (this._activeSlide)
				this._activeSlide.off(null, null, this);
			this._deck.off(null, null, this);
			popover.$el.remove();
		}
	};

	return ClassEditor;
});