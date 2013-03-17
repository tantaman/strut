define(
function() {
	return {
		save: function(storageInterface, model, filename, cb) {
			console.log("Saving");
			storageInterface.save(filename, model.exportPresentation(filename), cb);
		},

		open: function(storageInterface, model, filename, errBack) {
			console.log("Opening");
			storageInterface.load(filename, function(data, err) {
				if (!err) {
					model.importPresentation(data);
				} else {
					errBack();
				}
			});
		}
	};
});