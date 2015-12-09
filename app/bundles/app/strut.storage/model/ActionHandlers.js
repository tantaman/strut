define(
function() {
	return {
		save: function(storageInterface, model, chartBookName, cb) {
			storageInterface.savePresentation(chartBookName, model.exportPresentation(chartBookName), cb);
		},

		open: function(storageInterface, model, chartBookName, cb) {
			storageInterface.savePresentation(
				model.chartBookName(),
				model.exportPresentation(model.chartBookName()),
				function () {
					storageInterface.load(chartBookName, function(data, err) {
						if (!err) {
							model.importPresentation(data);
						} else {
							console.log(err);
							console.log(err.stack);
						}

						cb(null, err);
					});
				});
		},

		new_: function(model) {
			model.newPresentation();
		},
                
                delete: function(storageInterface, model, chartBookName, cb){
                    storageInterface.deletePresentation(chartBookName, model.exportPresentation(chartBookName), cb);
                }
	};
});