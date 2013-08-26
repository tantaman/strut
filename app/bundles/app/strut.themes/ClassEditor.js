define(['./Button'],
function(Button) {
	function ClassEditor(editorModel) {
		this._button = new Button({
			icon: 'icon-plus',
			cb: this._launch.bind(this),
			name: 'Class'
		});

		this._button.$el.addClass('iconBtns btn-grouped');
		this._button.disable();

		this._deck = editorModel.deck();
		// var activeSlide = editorModel.get('activeSlide');
		// if (activeSlide) {
		// 	this._activeSlideChanged(this._deck, activeSlide);
		// }

		this._deck.on('change:activeSlide', this._activeSlideChanged, this);
	}

	ClassEditor.prototype = {
		view: function() {
			return this._button;
		},

		_activeComponentChanged: function(slide, component) {
			console.log('Active component notification');
			if (component)
				this._button.enable();
			else
				this._button.disable();
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

		},

		dispose: function() {
			console.log('Disposing class editor');
			if (this._activeSlide)
				this._activeSlide.off(null, null, this);
			this._deck.off(null, null, this);
		}
	};

	return ClassEditor;
});