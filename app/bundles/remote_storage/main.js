define(['./RemoteStorageProvider'],
function(RemoteStorageProvider) {
	var service = new RemoteStorageProvider();

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.StorageProvider'
			}, service);
		}
	};
});