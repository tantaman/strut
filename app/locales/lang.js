define(['../locales/de', '../locales/en', '../locales/es', '../locales/fr', 'handlebars'],
function(de, en, es, fr, handlebars) {
	var langs = {
		en: en,
		de: de,
		es: es,
		fr: fr
	};

	var result = langs[window.navigator.language.split('-')[0]];
	handlebars.registerHelper("lang", function(key) {
		return result[key];
	});

	return result;
});