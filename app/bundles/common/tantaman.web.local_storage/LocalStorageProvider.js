define(function() {
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

		ls: function(path, regex, cb) {
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

			cb(fnames);

			return this;
		},

		rm: function(path, cb) {
			this.impl.removeItem(prefix + path);
			if (cb)
				cb(true);
			return this;
		},

		getContents: function(path, cb) {
			var item = this.impl.getItem(prefix + path);
			if (item != null) {
				try {
					var data = JSON.parse(item);
					cb(data);
				} catch (e) {
					cb(null, e);
				}
			}

			return this;
		},

		setContents: function(path, data, cb) {
			try {
				this.impl.setItem(prefix + path, JSON.stringify(data));
			} catch (e) {
				if (!alerted) {
					alerted = true;
					alert("Strut currently uses your browser's LocalStorage to save presentations which is limited to between 2.5 and 5mb.\n\nYou are currently over this limit so your presentation will not be saved.  You may continue editing, however.\n\nTry removing any images you dragged in and link to them instead.\n\nWe're working on improving the storage capacity!  5mb should be good if you link to your images (e.g., file://path/to/image or http://url/of/image).\n\nSorry for the inconvenience that this may cause.  We are working to resolve the issue!");
				}
			}
			if (cb)
				cb(true);
			return this;
		}
	};

	return LocalStorageProvider;
});