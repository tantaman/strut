define(['codemirror/ManagedEditors',
		'codemirror/modes/markdown',
		'./Utils'],
function(managedEditors, md, Utils) {

	var defaultValue = "# Markdown!\n";
	var extraKeys = {"Enter": "newlineAndIndentContinueMarkdownList"};
	var editorElem;
	var editor = managedEditors.getEditor('optableeditor', {
        mode: 'markdown',
        lineNumbers: true,
        theme: "default",
        extraKeys: extraKeys
      });

	function MarkdownEditor(opts) {
		this._opts = opts;
		this.$el = $(editor.el);
		this._resize = this._resize.bind(this);
	}

	MarkdownEditor.prototype = {
		show: function(value) {
			editor.mirror.setOption('mode', 'markdown');
			editor.mirror.setOption('extraKeys', extraKeys);
			this._resize();
			this._bindResize();
			this._opts.$target.append(this.$el);
			this.setValue(value);
		},

		setValue: function(value) {
			value = value || defaultValue;
			editor.mirror.setValue(value);
			editor.mirror.getDoc().clearHistory();
		},

		getValue: function() {
			var value = editor.mirror.getValue();
			if (value == defaultValue)
				return '';
			return value;
		},

		hide: function() {
			editor.mirror.setValue('');
			this._unbindResize();
			this.$el.detach();
		},

		_bindResize: function() {
			$(window).on('resize', this._resize);
		},

		_resize: function() {
			var dimensions = Utils.computeSlideDimensions(this._opts.$target);
			editor.mirror.setSize(dimensions.scaledWidth, this._opts.$target.height() - 20);
			this.$el.css({
				'margin-left': dimensions.remainingWidth / 2,
				'margin-right': dimensions.remainingWidth / 2
			});
		},

		_unbindResize: function() {
			$(window).off('resize', this._resize);
		}
	};

	return MarkdownEditor;
});