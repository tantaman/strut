define(
function() {
	return {
		save: function(storageInterface, model, filename, cb) {
			storageInterface.savePresentation(filename, model.exportPresentation(filename), cb);
		},

		open: function(storageInterface, model, filename, cb) {
			// When opening a new presentation:

			// 1. save the current presentation
			storageInterface
			.savePresentation(model.fileName(),
							  model.exportPresentation(model.fileName()))
			// 2. open the requested presentation
			.then(function () {
				return storageInterface.load(filename);
			}).then(function(data) {
				model.importPresentation(data);
				cb(null);
			}).catch(function(err) {
				cb(err);
				console.log(err);
				console.log(err.stack);
			});
		},

		new_: function(model) {
			model.newPresentation();
		}
	};
});