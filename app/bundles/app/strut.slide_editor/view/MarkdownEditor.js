define(['codemirror/ManagedEditors', 'codemirror/modes/markdown', './Utils'],
function(managedEditors, md, Utils) {

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
	}

	MarkdownEditor.prototype = {
		show: function() {
			editor.mirror.setOption('mode', 'markdown');
			editor.mirror.setOption('extraKeys', extraKeys);
			this._resize();
			this._bindResize();
			this._opts.$target.append(this.$el);

			// Look for existing markdown in the slide, if none:
			editor.mirror.setValue("# Markdown!\n");
		},

		hide: function() {
			editor.setValue('');
			this._unbindResize();
			this.$el.detach();
		},

		_bindResize: function() {
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

		}
	};

	return MarkdownEditor;
});