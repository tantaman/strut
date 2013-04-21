define(['./GlobalEvents',
		'lang'],
function(GlobalEvents, lang) {
	'use strict';

	return {
		initialize: function(registry) {
			var actions = [['undo', 'Z'], ['redo', 'Y'],
				['cut', 'X'], ['copy', 'C'], ['paste', 'V']];

			actions.forEach(function(action) {
				registry.register({
					interfaces: 'strut.editor.glob.action',
					meta: {
						title: lang[action[0]],
						action: action[0],
						// TODO: detect OS and present correct ctrl char.
						hotkey: 'Ctrl+' + action[1]
					}
				}, function() {
					GlobalEvents.trigger(action[0]);
				});
			});
		}
	};
});