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
			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						slideEditor: true
					}
				}
			}, slideBgProviderFactory);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						transitionEditor: true
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