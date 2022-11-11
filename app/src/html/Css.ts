'use strict';

import Util from '../Util';

export default {
	textToObject: function(cssText: string): {[key:string]: string} {
		return Util.renameKeys(
			Util.curry1_1(Util.camelize, '-'),
			Util.mapFromString(';', ':', cssText)
		);
	},

	toClassString: function(obj: {[key:string]: boolean}): string {
		var str = '';
		for (var key in obj) {
			if (obj[key]) {
				str += key + ' ';
			}
		}

		return str;
	},

	joinClasses(orig: string, more?: string): string {
		if (!more) {
			return orig;
		}

		return orig + ' ' + more;
	}
};
