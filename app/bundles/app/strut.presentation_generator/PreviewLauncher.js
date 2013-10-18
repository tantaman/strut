define(["require"],
function(require) {
	'use strict';
	var launch = 0;

	function PreviewLauncher(editorModel) {
		this._editorModel = editorModel;
	};

	PreviewLauncher.prototype = {
		launch: function(generator) {
			if (window.previewWind)
				window.previewWind.close();

			this._editorModel.trigger('launch:preview', null);

			var previewStr = generator.generate(this._editorModel.deck());

			localStorage.setItem('preview-string', previewStr);
			localStorage.setItem('preview-config', JSON.stringify({
				surface: this._editorModel.deck().get('surface')
			}));

			window.previewWind = window.open(
				require.toUrl('preview_export/' + generator.id + '.html') + generator.getSlideHash(this._editorModel),
				window.location.href);
			var sourceWind = window;
		}
	};

	return PreviewLauncher;
});
