define(['./impl/remoteStorage', './impl/modules/presentations'],
function(remoteStorage, presentations) {
	function RemoteStorageProvider() {
		this.id = "remoteStorage";
		this.name = "Remote Storage";
	}

	var setup = false;
	var activated = false;
	var $widget;
	function oneTimeSetup($el, cb) {
		$widget = $('<div id="remotestorage-connect"></div>');
		$el.append($widget);

		setTimeout(function() {
			remoteStorage.claimAccess({presentations: 'rw'})
			.then(function() {
				remoteStorage.displayWidget('remotestorage-connect');

				remoteStorage.onWidget('ready', function() {
					activated = true;
					cb();
				});

				remoteStorage.onWidget('disconnect', function() {
					activated = false;
					cb();
				})
			});
		}, 0);
	}

	RemoteStorageProvider.prototype = {
		activate: function($el, cb) {
			if (!setup) {
				oneTimeSetup($el, cb);
			} else {
				$el.append($widget);
				cb();
			}
		},

		bg: function() {
			$widget.detach();
		},

		ready: function($el) {
			if (activated) {
				$el.append($widget);
			}
			return activated;
		},

		ls: function(path, filter, callback) {
			if (path == "/")
				path = "";
			
			presentations.private.list(path, function(listing) {
				// TODO: apply filter
				callback(listing);
			});
		},

		rm: function(path, cb) {
			presentations.private.remove(path, cb);
		},

		getContents: function(path, cb) {
			// TODO: the remoteStorage Promise API looks like..?
			presentations.private.get(path).then(cb);
		},

		setContents: function(path, data, cb) {
			// TODO: what type of confirmation does set provide, if any?
			presentations.private.set(path, data);
			cb(true);
		}
	};

	return RemoteStorageProvider;
});