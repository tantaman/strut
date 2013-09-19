define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			this._editorModel.on('launch:preview', this._triggerSave, this);
			this._editorModel.on('change:modeId', this._triggerSave, this);
		},

		deck: function() {
			return this._editorModel.deck();
		},

		activeSlide: function() {
			return this._editorModel.deck().get('activeSlide');
		},

		isMarkdownMode: function() { return this.get('mode') == 'markdown'; },

		toggleMarkdown: function() {
			if (this.isMarkdownMode()) {
				this.set('mode', 'preview');
			} else {
				this.set('mode', 'markdown');
			}
		},

		dispose: function() {
			this._editorModel.off(null, null, this);
			this.off();
		},

		_triggerSave: function() {
			this.trigger('saveEdits', null);
		},

		constructor: function SlideEditorModel(opts) {
			this._editorModel = opts.editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});