define(['./BackgroundProvider',
		'./AvailableBackgrounds',
		'./AvailableSurfaces',
		'./StylesheetProvider',
		'./ClassEditor'],
function(BackgroundProvider, Backgrounds, Surfaces, StylesheetProvider, ClassEditor) {
	'use strict';

	var slideBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider({
				backgrounds: Backgrounds,
				editorModel: editorModel,
				selector: '.slideContainer',
				attr: 'Background',
				template: JST['strut.themes/BackgroundChooserDropdown']
			});
		}
	};

	var surfaceBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider({
				backgrounds: Surfaces,
				editorModel: editorModel,
				selector: '.strut-surface',
				attr: 'Surface',
				template: JST['strut.themes/SurfaceChooserDropdown']
			});
		}
	};

	var stylesheetProviderFactory = {
		create: function(editorModel) {
			return new StylesheetProvider(editorModel);
		}
	};

	var classEditorFactory = {
		create: function(editorModel) {
			return new ClassEditor(editorModel);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'slide-editor': true,
						'transition-editor': true
					},
					overflow: false
				}
			}, slideBgProviderFactory);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'slide-editor': true,
						'transition-editor': true,
					},
					overflow: false
				}
			}, surfaceBgProviderFactory);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'transition-editor': true,
						'slide-editor': true
					},
					overflow: true
				}
			}, stylesheetProviderFactory);

			registry.register({
				interfaces: 'strut.ThemeProvider',
				meta: {
					modes: {
						'transition-editor': true,
						'slide-editor': true
					},
					overflow: true
				}
			}, classEditorFactory);

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