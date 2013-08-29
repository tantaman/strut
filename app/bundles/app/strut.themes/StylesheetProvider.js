define(['tantaman/web/widgets/CodeEditor',
		'./Button',
		'tantaman/web/css_manip/CssManip',
		'css!styles/strut.themes/stylesheetEditor.css'],
function(CodeEditor, Button, CssManip, empty) {
	var cssEditor = new CodeEditor({
			class: 'stylesheetEditor',
			title: 'Edit CSS',
			placeholder: ".customText {\n" +
						 "font-weight: bold;\n" +
						 "}"
		});
	var sheetId = 'userStylesheet';

	var userStylesheet = CssManip.getStyleElem({
		id: sheetId,
		create: true
	});

	var sheetInitialized = false;

	$('#modals').append(cssEditor.render().$el);

	function StylesheetProvider(editorModel) {
		this._cssEditor = cssEditor;
		this._editorModel = editorModel;
		userStylesheet.innerHTML = editorModel.customStylesheet();

		editorModel.deck().on(
			'change:customStylesheet', this._editorSheetChanged, this);

		this._button = new Button({
			icon: 'icon-edit',
			cb: this._launch.bind(this),
			name: 'CSS'
		});

		this._button.$el.addClass('iconBtns btn-grouped');
		this._cssSaved = this._cssSaved.bind(this);

		// initialize the sheet from the deck attributes.
		if (!sheetInitialized) {
			sheetInitialized = true;
		}
	}

	StylesheetProvider.prototype = {
		view: function() {
			return this._button;
		},

		_launch: function() {
			this._cssEditor.show(this._cssSaved, this._editorModel.customStylesheet());
		},

		_cssSaved: function(css) {
			userStylesheet.innerHTML = css;
			this._editorModel.customStylesheet(css);
			this._cssEditor.hide();
		},

		_editorSheetChanged: function(deck, sheet) {
			userStylesheet.innerHTML = sheet;
		},

		dispose: function() {
			this._editorModel.deck().off(null, null, this);
		}
	};

	return StylesheetProvider;
});