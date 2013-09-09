define(['./GlobalEvents',
		'lang'],
function(GlobalEvents, lang) {
	'use strict';

	return {
		initialize: function(registry) {
			var actions;
			if (navigator.appVersion.indexOf("Mac") != -1) {
				actions = [['undo', '⌘+Z'], ['redo', '⌘+Y'],
					['cut', '⌘+X'], ['copy', '⌘+C'], ['paste', '⌘+V'], ['delete', '⌘+⌫']];
			}
			else {
				actions = [['undo', 'Ctrl+Z'], ['redo', 'Ctrl+Y'],
					['cut', 'Ctrl+X'], ['copy', 'Ctrl+C'], ['paste', 'Ctrl+V'], ['delete', 'Del']];
			}

			actions.forEach(function(action) {
				registry.register({
					interfaces: 'strut.editor.glob.action',
					meta: {
						title: lang[action[0]],
						action: action[0],
						hotkey: action[1]
					}
				}, function() {
					GlobalEvents.trigger(action[0]);
				});
			});
		}
	};
});