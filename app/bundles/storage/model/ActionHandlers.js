define(
function() {
	return {
		save: function(storageInterface, model, filename, cb) {
			console.log("Saving");
			storageInterface.savePresentation(filename, model.exportPresentation(filename), cb);
		},

		open: function(storageInterface, model, filename, cb) {
			console.log("Opening");
			storageInterface.load(filename, function(data, err) {
				if (!err) {
					model.importPresentation(data);
				} else {
					console.log("GOT AN ERROR???");
					console.log(err);
					console.log(err.stack);
				}

				cb(null, err);
			});
		}
	};
});