define(['../locales/de',
		'../locales/en',
		'../locales/es',
		'../locales/fr',
		'../locales/nl',
		'handlebars'],
function(de, en, es, fr, nl, handlebars) {
	var langs = {
		en: en,
		de: de,
		es: es,
		fr: fr,
		nl: nl
	};

	var lang = window.navigator.language || window.navigator.userLanguage;
	var result = langs[lang.split('-')[0]] || langs.en;
	handlebars.registerHelper("lang", function(key) {
		return result[key];
	});

	return result;
});
