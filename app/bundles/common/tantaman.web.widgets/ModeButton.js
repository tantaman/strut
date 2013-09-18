define(function () {
	function ModeButton(editorModel, modeId, template) {
		this.$el = $(template());
		this.modeId = modeId;

		this.clicked = this.clicked.bind(this);
		this.modeChanged = this.modeChanged.bind(this);

		this.$el.click(this.clicked);
		this.el = this.$el[0];

		this.editorModel = editorModel;
		editorModel.on('change:activeMode', this.modeChanged, this);
	}

	ModeButton.prototype.render = function() {
		return this;
	}

	ModeButton.prototype.clicked = function() {
		this.editorModel.changeActiveMode(this.modeId);
	}

	ModeButton.prototype.generatorChanged = function(model, value) {
		// Filter the modes on a per-generator basis
	}

	ModeButton.prototype.modeChanged = function(model, value) {
		if (model.get('modeId') == this.modeId) {
			this.$el.addClass('dispNone');
		} else {
			this.$el.removeClass('dispNone');
		}
	}

	return ModeButton;
});