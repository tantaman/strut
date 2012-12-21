define(['./view/ComponentButton',
		'./model/Image',
		'./model/TextBox',
		'./model/WebFrame',
		'./model/Video',
		'./view/ImageView',
		'./view/TextBoxView',
		'./view/WebFrameView',
		'./view/VideoView',
		'./drawers/TextBoxDrawer',
		'./drawers/ImageDrawer'],
function(Button,
		Image, TextBox, WebFrame, Video,
		ImageView, TextBoxView, WebFrameView, VideoView,
		TextBoxDrawer, ImageDrawer) {
	var service = {
		createButtons: function(editorModel) {
			var buttons = [];

			buttons.push(new Button({
				componentType: 'TextBox',
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
			// Register each component as a service
			// so it can be picked up by the ComponentFactory
			// If 3rd parties want to add components
			// then they just add their components to the registry as well.
			registry.register({
				interfaces: 'strut.ComponentButtonProvider'
			}, service);

			registry.register({
				interfaces: 'strut.ComponentModel',
				meta: {
					type: 'Image'
				}
			}, Image);

			registry.register({
				interfaces: 'strut.ComponentModel',
				meta: {
					type: 'TextBox'
				}
			}, TextBox);

			registry.register({
				interfaces: 'strut.ComponentModel',
				meta: {
					type: 'WebFrame'
				}
			}, WebFrame);

			registry.register({
				interfaces: 'strut.ComponentModel',
				meta: {
					type: 'Video'
				}
			}, Video);

			registry.register({
				interfaces: 'strut.ComponentView',
				meta: {
					type: 'Image'
				}
			}, ImageView);

			registry.register({
				interfaces: 'strut.ComponentView',
				meta: {
					type: 'TextBox'
				}
			}, TextBoxView);

			registry.register({
				interfaces: 'strut.ComponentView',
				meta: {
					type: 'WebFrame'
				}
			}, WebFrameView);

			registry.register({
				interfaces: 'strut.ComponentView',
				meta: {
					type: 'Video'
				}
			}, VideoView);

			registry.register({
				interfaces: 'strut.ComponentDrawer',
				meta: {
					type: 'Image'
				}
			}, ImageDrawer);

			registry.register({
				interfaces: 'strut.ComponentDrawer',
				meta: {
					type: 'TextBox'
				}
			}, TextBoxDrawer)
		}
	};
});