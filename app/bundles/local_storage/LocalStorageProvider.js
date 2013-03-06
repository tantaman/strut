define(function() {
	function LocalStorageProvider() {
		this.impl = localStorage;
		this.name = "Local Storage";
		this.id = "localstorage";
	}

	LocalStorageProvider.prototype = {
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

		cd: function(path) {
			return this;
		},

		rm: function(path, cb) {
			this.impl.removeItem(prefix + path);
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
			return this;
		}
	};

	return LocalStorageProvider;
});