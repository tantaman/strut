define(["./LocalStorageProvider"],
function(LocalStorageProvider) {
	var service = new LocalStorageProvider();

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.StorageProvider'
			}, service);
		}
	};
});