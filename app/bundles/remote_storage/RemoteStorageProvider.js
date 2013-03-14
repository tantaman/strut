define(['./impl/remoteStorage', './impl/modules/presentations'],
function(remoteStorage, Presentations) {
	function RemoteStorageProvider() {
		this.id = "remoteStorage";
		this.name = "Remote Storage";
	}

	var setup = false;
	var activated = false;
	var $widget;
	function oneTimeSetup($el) {
		$widget = $('<div id="remotestorage-connect"></div>');
		$el.append($widget);

		setTimeout(function() {
			remoteStorage.claimAccess({presentations: 'rw'})
			.then(function() {
				remoteStorage.displayWidget('remotestorage-connect');

				remoteStorage.onWidget('ready', function() {
					activated = true;
				});

				remoteStorage.onWidget('disconnect', function() {
					activated = false;
				})
			});
		}, 0);
	}

	RemoteStorageProvider.prototype = {
		activate: function($el) {
			if (!setup) {
				oneTimeSetup($el);
			} else {
				$el.append($widget);
			}
		},

		bg: function() {
			$widget.detach();
		},

		ready: function($el) {
			if (activated) {
				console.log("APPENDING")
				console.log($widget);
				$el.append($widget);
			}
			return activated;
		},

		ls: function() {

		},

		cd: function() {

		},

		rm: function() {

		},

		getContents: function() {

		},

		setContents: function() {

		}
	};

	return RemoteStorageProvider;
});