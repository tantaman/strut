define(['libs/backbone',
		'./SlideWell',
		'./OperatingTable',
		'./MarkdownEditor'],
function(Backbone, SlideWell, OperatingTable, MarkdownEditor) {
	'use stict';
	return Backbone.View.extend({
		className: 'slideEditor',

		initialize: function() {
			//this._template = JST['strut.slide_editor/SlideEditor'];
			this._well = new SlideWell(this.model._editorModel);
			this._opTable = new OperatingTable(this.model._editorModel, this.model);
			this._markdownEditor = new MarkdownEditor({
				$target: this._opTable.$el
			});

			this.model.on('change:mode', this._modeChanged, this);
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			this.model.dispose();
			this._opTable.dispose();
		},

		render: function() {
			this.$el.html();
			this.$el.append(this._well.render().$el);
			this.$el.append(this._opTable.render().$el);
			return this;
		},

		_modeChanged: function(model, mode) {
			if (mode == 'markdown') {
				this._markdownEditor.show();
			} else if (mode == 'preview') {
				this._markdownEditor.hide();
			} else {
				throw "Illegal mode";
			}
		},

		constructor: function SlideEditorView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});