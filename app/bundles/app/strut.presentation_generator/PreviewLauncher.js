define(function() {
	'use strict';

	function PreviewLauncher(editorModel) {
		this._editorModel = editorModel;
	};

	PreviewLauncher.prototype = {
		launch: function(generator) {
			var previewStr = generator.generate(this._editorModel.deck().attributes);
			window.previewWind = window.open('index.html?preview=true');
			var sourceWind = window;

			var self = this;
			function cb() {
				if (!sourceWind.previewWind.startImpress) {
					setTimeout(cb, 200);
				} else {
					sourceWind.
						previewWind.document.
							getElementsByTagName("html")[0].innerHTML = previewStr;
					if (!sourceWind.previewWind.impressStarted) {
						sourceWind.previewWind.startImpress(sourceWind.previewWind.document, sourceWind.previewWind);
						sourceWind.previewWind.imp = sourceWind.previewWind.impress();
						sourceWind.previewWind.imp.init();
						sourceWind.previewWind.imp.goto(self._editorModel.activeSlide().get('num'));
					}
				}
			};

			$(window.previewWind.document).ready(cb);
		}
	};

	return PreviewLauncher;
});