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

require(['model/common_application/UndoHistory'], function(UndoHistory) {
	window.undoHistory = new UndoHistory(20);
	continuation();
});

function continuation() {
	require(['test/ServiceRegistryLite',
		'test/UndoHistory',
		'test/Deck',
		'test/Slide'],
	function() {

	});
}