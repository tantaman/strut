// TODO: get rid of these.  Context buttons should be added
// based on available capabilities...
define(['./AddSlideButton', 'lang'],
function(AddSlideButton, lang) {
	'use strict';

	var service = {
		createButtons: function(editorModel, wellMenuModel) {
			var result = [];

			result.push(new AddSlideButton(editorModel, wellMenuModel));

			return result;
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: ['strut.WellContextButtonProvider']
			}, service);
		}
	}
});
