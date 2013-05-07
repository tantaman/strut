define(['./SurfaceBackgroundProvider',
		'./SlideBackgroundProvider'],
function(SurfaceBackgroundProvider, SlideBackgroundProvider) {
	'use strict';

	var slideBgProviderFactory = {
		create: function(editorModel) {
			return new SlideBackgroundProvider(editorModel);
		}
	};

	var surfaceBgProviderFactory = {
		create: function(editorModel) {
			return new SurfaceBackgroundProvider(editorModel);
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