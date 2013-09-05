define(function() {
	'use strict';
	var launch = 0;

	function PreviewLauncher(editorModel) {
		this._editorModel = editorModel;
	};

	PreviewLauncher.prototype = {
		launch: function(generator) {
			if (window.previewWind)
				window.previewWind.close();

			var previewStr = generator.generate(this._editorModel.deck().attributes);
			window.previewWind = window.open(
				'empty.html' + generator.getSlideHash(this._editorModel),
				window.location.href);
			var sourceWind = window;

			$(window.previewWind).load(
				generator.getStartPreviewFn(
					this._editorModel,
					sourceWind,
					previewStr)
			);
		}
	};

	return PreviewLauncher;
});