define(['tantaman/web/widgets/Button',
	'tantaman/web/widgets/PopoverTextbox'],
	function(Button, PopoverTextbox) {
		/**
		 * Allows to assign custom css classes to elements on slide.
		 *
		 * @param editorModel
		 * @constructor
		 */
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
			this._popover = new PopoverTextbox({title: 'Classes: '});
			this._popover.render();
			var activeSlide = this._deck.get('activeSlide');
			if (activeSlide) {
				this._activeSlideChanged(this._deck, activeSlide);
			}

			this._deck.on('change:activeSlide', this._activeSlideChanged, this);
			this._classesSaved = this._classesSaved.bind(this);
		}

		ClassEditor.prototype = {
			/**
			 * Returns ClassEditor button to be placed in main menu.
			 *
			 * @returns {Button}
			 */
			view: function() {
				return this._button;
			},

			/**
			 * Reacts on an active slide change.
			 *
			 * @param {Deck} deck
			 * @param {Slide} slide
			 * @private
			 */
			_activeSlideChanged: function(deck, slide) {
				if (this._activeSlide) {
					this._activeSlide.off(null, null, this);
				}

				this._activeSlide = slide;
				if (this._activeSlide) {
					this._activeSlide.on('change:activeComponent', this._activeComponentsChanged, this);
					this._activeComponentsChanged(slide);
				}
			},

			/**
			 * Reacts on an active component change.
			 *
			 * @param {Slide} slide Parent slide of the component being changed.
			 * @private
			 */
			_activeComponentsChanged: function(slide) {
				this._activeComponents = this._activeSlide.selected;
				if (this._activeComponents.length) {
					this._button.enable();
				}
				else {
					this._button.disable();
				}
				this._popover.hide();
			},
			
			/**
			 * Menu button click callback.
			 *
			 * @private
			 */
			_launch: function() {
				if (!this._appended) {
					var $slideEditArea = $('.slideContainer');
					$slideEditArea.append(this._popover.$el);
					this._appended = true;
				}

				if (this._activeComponents.length) {
					this._popover.show({
						left: this._activeComponents[0].get('x'),
						top: this._activeComponents[0].get('y')
					}, this._classesSaved, this._activeComponents[0].customClasses());
				}
				else {
					alert('Please, select some component first.');
				}
			},

			/**
			 * Popover save callback.
			 *
			 * @param {string} classes Text which contains list of classes.
			 * @private
			 */
			_classesSaved: function(classes) {
				this._activeComponents.forEach(function(component) {
					component.customClasses(classes);
				});
				this._popover.hide();
			},

			/**
			 * Removes ClassEditor from the editor.
			 */
			dispose: function() {
				if (this._activeSlide)
					this._activeSlide.off(null, null, this);
				this._deck.off(null, null, this);
				this._popover.remove();
			}
		};

		return ClassEditor;
	});