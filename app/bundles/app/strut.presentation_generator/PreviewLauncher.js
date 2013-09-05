define(function() {
	'use strict';

	function PreviewLauncher(editorModel) {
		this._editorModel = editorModel;
	};

	PreviewLauncher.prototype = {
		launch: function(generator) {
			var previewStr = generator.generate(this._editorModel.deck().attributes);
			window.previewWind = window.open();
			var sourceWind = window;

			$(window.previewWind.document).ready(
				generator.getStartPreviewFn(
					this._editorModel,
					sourceWind,
					previewStr)
			);
		}
	};

	return PreviewLauncher;
});