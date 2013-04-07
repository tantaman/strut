define(["./LocalStorageProvider"],
function(LocalStorageProvider) {
	var service = new LocalStorageProvider();

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'tantaman.web.StorageProvider'
			}, service);
		}
	};
});