define(['../locales/de', '../locales/en', '../locales/es'],
function(de, en, es) {
	var langs = {
		en: en,
		de: de,
		es: es
	};

	return langs[window.navigator.language.split('-')[0]];
});