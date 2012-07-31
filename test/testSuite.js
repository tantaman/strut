require.config({
	baseUrl: "../web/scripts",
	paths: {
		'test': '../../test'
	}
});

window.slideConfig = {
		size: {
			width: 1024,
			height: 768
		}
	};

require(['test/ServiceRegistryLite',
		'test/UndoHistory',
		'test/Deck',
		'test/Slide'],
function() {
	
});