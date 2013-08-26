define(function() {
	return {
		createStylesheet: function(options) {
			var sheet = document.createElement('style');
			sheet.type = 'text/css';
			if (options.id)
				sheet.id = options.id;

			return sheet;
		},

		getStylesheet: function(options) {
			var sheet = document.getElementById(options.id);
			if (!sheet && options.create) {
				sheet = this.createStylesheet(options);
				this.appendStylesheet(sheet);
			}

			return sheet;
		},

		appendStylesheet: function(sheet) {
			document.getElementsByTagName('head')[0].appendChild(sheet);
		}
	};
});