define(['./RemoteStorageProvider'],
function(RemoteStorageProvider) {
	var service = new RemoteStorageProvider();

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'tantaman.web.StorageProvider'
			}, service);
		}
	};
});