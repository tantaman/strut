define(function() {
	var prefix = 'Strut-pres-';

	function LocalStorageProvider() {
		this.impl = localStorage;
		this.name = "Local Storage";
		this.id = "localstorage";
	}

	LocalStorageProvider.prototype = {
		ls: function(path, cb) {
			// Paths are currently ignored
			var numFiles = this.impl.length;
			var fnames = [];
			for (var i = 0; i < numFiles; ++i) {
				var fname = this.impl.key(i);
				if (fname.indexOf(prefix) !== -1) {
					fnames.push(fname.replace(prefix, ''));
				}
			}

			cb(fnames);

			return this;
		},

		cd: function(path) {
			return this;
		},

		rm: function(path) {
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

		setContents: function(path, data) {
			this.impl.setItem(prefix + path, JSON.stringify(data));
			return this;
		}
	};

	return LocalStorageProvider;
});