define(function() {
	// var ident = /-?[_a-zA-Z]+[_a-zA-Z0-9-]*/;
	var classesReg = /\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g;

	return {
		createStyleElem: function(options) {
			var sheet = document.createElement('style');
			sheet.type = 'text/css';
			if (options.id)
				sheet.id = options.id;

			return sheet;
		},

		getStyleElem: function(options) {
			var sheet = document.getElementById(options.id);
			if (!sheet && options.create) {
				sheet = this.createStyleElem(options);
				this.appendStyleElem(sheet);
			}

			return sheet;
		},

		appendStyleElem: function(elem) {
			document.getElementsByTagName('head')[0].appendChild(elem);
		},

		extractClasses: function(sheet) {
			var rules = sheet.rules || sheet.cssRules;

			var result = {};
			for (var j = 0; j < rules.length; ++j) {
				var rule = rules[j];
				var matches = rule.selectorText.match(classesReg);
				if (matches) {
					for (var i = 0; i < matches.length; ++i) {
						var match = matches[i].substring(1);
						result[match] = true;
					}
				}
			}

			return result;
		}
	};
});