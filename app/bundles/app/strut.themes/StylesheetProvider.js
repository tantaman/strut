define(['tantaman/web/widgets/CodeEditor',
		'./Button'],
function(CodeEditor, Button) {
	function StylesheetProvider(editorModel) {
		this._cssEditor = new CodeEditor({
			class: 'stylesheetEditor'
		});

		this._button = new Button({
			icon: 'icon-edit',
			cb: this._launch.bind(this),
			name: 'CSS'
		});

		this._button.$el.addClass('iconBtns btn-grouped');
	}

	StylesheetProvider.prototype = {
		view: function() {
			return this._button;
		},

		_launch: function() {

		},

		dispose: function() {

		}
	};

	return StylesheetProvider;
});