define(['./view/ComponentButton',
		'./view/ImportingComponentButton',
		'./model/Image',
		'./model/TextBox',
		'./model/WebFrame',
		'./model/Video',
		'./view/ImageView',
		'./view/TextBoxView',
		'./view/WebFrameView',
		'./view/VideoView',
		'./drawers/TextBoxDrawer',
		'./drawers/ImageDrawer',
		'./ComponentFactory',
		'lang'],
function(Button, ImportingComponentButton,
		Image, TextBox, WebFrame, Video,
		ImageView, TextBoxView, WebFrameView, VideoView,
		TextBoxDrawer, ImageDrawer, ComponentFactory, lang) {
	var service = {
		createButtons: function(editorModel) {
			var buttons = [];

			buttons.push(new Button({
				componentType: 'TextBox',
				icon: 'icon-text-width',
				name: lang.text,
				editorModel: editorModel
			}));

			buttons.push(new ImportingComponentButton({
				componentType: 'Image',
				icon: 'icon-picture',
				name: lang.image,
				tag: 'img',
				title: lang.insert_image,
				editorModel: editorModel,
				browsable: true
			}));

			buttons.push(new ImportingComponentButton({
				componentType: 'Video',
				icon: 'icon-film',
				name: lang.video,
				tag: 'video',
				title: lang.insert_video,
				editorModel: editorModel,
				ignoreErrors: true
			}));

			buttons.push(new ImportingComponentButton({
				componentType: 'WebFrame',
				icon: 'icon-globe',
				name: lang.website,
				tag: 'iframe',
				title: lang.insert_website,
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
			}, TextBoxDrawer);

			ComponentFactory.initialize(registry);
		}
	};
});