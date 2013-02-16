define(['./AddSlideButton'],
function(AddSlideButton) {
	'use strict';

	var service = {
		createButtons: function(editorModel) {
			var result = [];

			result.push(new AddSlideButton(editorModel));

			return result;
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.WellContextButtonProvider'
			}, service);
		}
	}
});