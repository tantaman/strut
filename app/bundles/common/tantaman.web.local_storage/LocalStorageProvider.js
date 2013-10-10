define(['Q'], function(Q) {
	var prefix = "strut-";
	function LocalStorageProvider() {
		this.impl = localStorage;
		this.name = "Local Storage";
		this.id = "localstorage";
	}
	var alerted = false;

	LocalStorageProvider.prototype = {
		ready: function() {
			return true;
		},

		bg: function() {

		},

		ls: function(path, regex) {
			// Paths are currently ignored
			var numFiles = this.impl.length;
			var fnames = [];
			for (var i = 0; i < numFiles; ++i) {
				var fname = this.impl.key(i);
				if (fname.indexOf(prefix) == 0 &&
					(regex == null || regex.exec(fname) != null)) {
					fnames.push(fname.substring(prefix.length));
				}
			}

			return Q(fnames);
		},

		rm: function(path) {
			this.impl.removeItem(prefix + path);
			return Q(true);
		},

		getContents: function(path) {
			var item = this.impl.getItem(prefix + path);
			if (item != null) {
				try {
					var data = JSON.parse(item);
					return Q(data);
				} catch (e) {
					var deferred = Q.defer();
					deferred.reject(e);
					return deferred.promise;
				}
			}

			return this;
		},

		setContents: function(path, data) {
			try {
				this.impl.setItem(prefix + path, JSON.stringify(data));
			} catch (e) {
				if (!alerted) {
					alerted = true;
					alert("Strut currently uses your browser's LocalStorage to save presentations which is limited to between 2.5 and 5mb.\n\nYou are currently over this limit so your presentation will not be saved.  You may continue editing, however.\n\nTry removing any images you dragged in and link to them instead.\n\nWe're working on improving the storage capacity!  5mb should be good if you link to your images (e.g., file://path/to/image or http://url/of/image).\n\nSorry for the inconvenience that this may cause.  We are working to resolve the issue!");
				}
			}
			return Q(true);
		}
	};

	return LocalStorageProvider;
});