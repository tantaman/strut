require.config({
	baseUrl: "../web/scripts",
	paths: {
		'test': '../../test'
	}
});

require(['test/ServiceRegistryLite',
		'test/UndoHistory'],
function() {
	
});