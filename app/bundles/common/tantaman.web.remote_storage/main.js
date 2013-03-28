define(['./RemoteStorageProvider'],
function(RemoteStorageProvider) {
	var service = new RemoteStorageProvider();

	return {
		initialize: function(registry) {
			console.log("Remote init...");
			registry.register({
				interfaces: 'strut.StorageProvider'
			}, service);
		}
	};
});