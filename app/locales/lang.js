define(['../locales/de',
		'../locales/en',
		'../locales/es',
		'../locales/fr',
		'../locales/nl',
		'handlebars'],
function(de, en, es, fr, nl, handlebars) {
	console.log(arguments);
	var langs = {
		en: en,
		de: de,
		es: es,
		fr: fr,
		nl: nl
	};

	var result = langs[window.navigator.language.split('-')[0]] || langs.en;
	handlebars.registerHelper("lang", function(key) {
		return result[key];
	});

	return result;
});
