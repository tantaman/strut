define(['tantaman/web/widgets/CodeEditor',
		'./Button',
		'css!styles/strut.themes/stylesheetEditor.css'],
function(CodeEditor, Button, empty) {
	var cssEditor = new CodeEditor({
			class: 'stylesheetEditor',
			title: 'Edit CSS',
			placeholder: ".customText {\n" +
						 "font-weight: bold;\n" +
						 "}"
		});

	$('#modals').append(cssEditor.render().$el);

	function StylesheetProvider(editorModel) {
		this._cssEditor = cssEditor;

		this._button = new Button({
			icon: 'icon-edit',
			cb: this._launch.bind(this),
			name: 'CSS'
		});

		this._button.$el.addClass('iconBtns btn-grouped');
		this._cssSaved = this._cssSaved.bind(this);
	}

	StylesheetProvider.prototype = {
		view: function() {
			return this._button;
		},

		_launch: function() {
			this._cssEditor.show(this._cssSaved);
		},

		_cssSaved: function(css) {
			console.log('Callback from code editor');
			this._cssEditor.hide();
		},

		dispose: function() {
			console.log('Dispose of stylesheet provider?  Was the themebutton disposed too?');
		}
	};

	return StylesheetProvider;
});