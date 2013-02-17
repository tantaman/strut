define(['./AddSlideButton', 'lang'],
function(AddSlideButton, lang) {
	'use strict';

	function NewSlideMenuItem(editorModel) {
		this.$el = $('<li><a>' + lang.add_slide + '</a></li>');
		this.$el.click(function() {
			editorModel.addSlide();
		});
	}

	NewSlideMenuItem.prototype.render = function() {
		return this;
	};

	var service = {
		createButtons: function(editorModel) {
			var result = [];

			result.push(new AddSlideButton(editorModel));

			return result;
		},

		createMenuItems: function(editorModel) {
			return [new NewSlideMenuItem(editorModel)];
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: ['strut.WellContextButtonProvider', 'strut.LogoMenuItemProvider']
			}, service);
		}
	}
});