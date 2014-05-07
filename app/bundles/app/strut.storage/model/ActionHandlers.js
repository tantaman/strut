define(
function() {

	function saveCurrentPresentation(storageInterface, model) {
		return storageInterface
			.savePresentation(model.fileName(),
							  model.exportPresentation(model.fileName()));
	}

	return {
		save: function(storageInterface, model, filename, cb) {
			storageInterface.savePresentation(filename, model.exportPresentation(filename)).done(function(){
					cb && cb();
				});
		},

		open: function(storageInterface, model, filename, cb) {
			// When opening a new presentation:

			// 1. save the current presentation
			saveCurrentPresentation(storageInterface, model)
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

		new_: function(options) {
			// TODO: prompt for user input
			// of the new filename / presentation name.


			// TODO: don't do the saving of the current
			// prezzer here.
			saveCurrentPresentation(options.storageInterface, options.model)
			.then(function() {
				options.model.newPresentation();
			}, function(error) {
				// Error saving old presentation...
				console.log(error);
			}).done();
		}
	};
});
