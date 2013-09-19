define(['./model/SlideEditorModel',
		'./view/SlideEditorView',
		'tantaman/web/widgets/ModeButton',
		'tantaman/web/widgets/Button'],
function(SlideEditorModel, SlideEditorView, ModeButton, Button) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new SlideEditorModel({editorModel: editorModel});

			return {
				view: new SlideEditorView({model: model, registry: registry}),
				model: model,
				id: 'slide-editor',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel, 'slide-editor',
						JST['strut.slide_editor/Button']);
		}
	};

	// TODO: need to bind to mode changes
	function MarkdownControl(editorModel) {
		this._slideEditorModel = editorModel.get('activeMode').model;
		this._button = new Button({
			icon: 'icon-markdown-white',
			cb: this._toggleMarkdown.bind(this),
			name: 'MDown'
		});
		this._button.$el.addClass('iconBtns');

		this._slideEditorModel.on('change:mode', this._modeChanged, this);
	}

	MarkdownControl.prototype = {
		view: function() {
			return this._button;
		},

		_toggleMarkdown: function() {
			this._slideEditorModel.toggleMarkdown();
		},

		_modeChanged: function(model, mode) {
			if (mode == 'markdown') {
				this._button.$el.addClass('active');
			} else {
				this._button.$el.removeClass('active');
			}
		},

		dispose: function() {
			this._slideEditorModel.off(null, null, this);
		}
	}

	var markdownProviderFactory = {
		create: function(editorModel) {
			return new MarkdownControl(editorModel);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.EditMode',
				meta: {
					id: 'slide-editor'
				}
			}, service);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'slide-editor': true
					},
					overflow: true
				},
			}, markdownProviderFactory)
		}
	};
});