define(['../locales/de', '../locales/en', '../locales/es', 'handlebars'],
function(de, en, es, handlebars) {
	var langs = {
		en: en,
		de: de,
		es: es
	};

	var result = langs[window.navigator.language.split('-')[0]];
	handlebars.registerHelper("lang", function(key) {
		return result[key];
	});

	return result;
});