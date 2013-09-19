define(['./BackgroundProvider',
		'./AvailableBackgrounds',
		'./AvailableSurfaces',
		'./StylesheetProvider',
		'./ClassEditor'],
function(BackgroundProvider, Backgrounds, Surfaces, StylesheetProvider, ClassEditor) {
	'use strict';

	var slideBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider(Backgrounds, editorModel, '.slideContainer', 'Background', 'slideContainer ui-selectable');
		}
	};

	var surfaceBgProviderFactory = {
		create: function(editorModel) {
			return new BackgroundProvider(Surfaces, editorModel, '.slideTable', 'Surface', 'slideTable ui-selectable');
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