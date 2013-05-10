define(['./BackgroundProvider',
		'./AvailableBackgrounds',
		'./AvailableSurfaces'],
function(BackgroundProvider, Backgrounds, Surfaces) {
	'use strict';

	var slideBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider(Backgrounds, editorModel, '.slideContainer', 'background');
		}
	};

	var surfaceBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider(Surfaces, editorModel, '.slideTable', 'surface');
		}
	};

	return {
		initialize: function(registry) {
			console.log('Registering theme providers');
			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'slide-editor': true
					}
				}
			}, slideBgProviderFactory);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'transition-editor': true
					}
				}
			}, surfaceBgProviderFactory);

			/*
			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						slideEditor: true
					},
					engines: {
						bespoke: true
					}
				}
			}, bespokeThemes)
			*/
		}
	}
});