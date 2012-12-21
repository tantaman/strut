define(['./view/ComponentButton'],
function(Button) {
	var service = {
		createButtons: function(editorModel) {
			var buttons = [];

			buttons.push(new Button({
				componentType: 'Text',
				icon: 'icon-text-width',
				name: 'Text',
				editorModel: editorModel
			}));

			buttons.push(new Button({
				componentType: 'Image',
				icon: 'icon-picture',
				name: 'Image',
				editorModel: editorModel
			}));

			buttons.push(new Button({
				componentType: 'Video',
				icon: 'icon-facetime-video',
				name: 'Video',
				editorModel: editorModel
			}));

			buttons.push(new Button({
				componentType: 'WebFrame',
				icon: 'icon-globe',
				name: 'Website',
				editorModel: editorModel
			}));

			return buttons;
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.ComponentButtonProvider'
			}, service);
		}
	};
});