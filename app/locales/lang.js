define(['../locales/de',
		'../locales/en',
		'../locales/es',
		'../locales/fr',
	        '../locales/it',
		'../locales/nl',
		'../locales/ru',
		'../locales/ar',
		'handlebars'],
function(de, en, es, fr, it, nl, ru, ar, handlebars) {
	var langs = {
		en: en,
		de: de,
		es: es,
		fr: fr,
		it:  it,
		nl: nl,
		ru: ru,
		ar: ar
	};

	var lang = window.navigator.language || window.navigator.userLanguage;
	var result = langs[lang.split('-')[0]] || langs.en;
	handlebars.registerHelper("lang", function(key) {
		return result[key];
	});

	return result;
});
