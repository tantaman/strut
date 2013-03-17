define(function() {
	var prefix = "";
	function LocalStorageProvider() {
		this.impl = localStorage;
		this.name = "Local Storage";
		this.id = "localstorage";
	}

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
				if (regex == null || regex.exec(fname) != null) {
					fnames.push(fname);
				}
			}

			cb(fnames);

			return this;
		},

		rm: function(path, cb) {
			this.impl.removeItem(prefix + path);
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
			this.impl.setItem(prefix + path, JSON.stringify(data));
			cb(true);
			return this;
		}
	};

	return LocalStorageProvider;
});