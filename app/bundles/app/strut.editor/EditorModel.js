define(['libs/backbone',
	'strut/header/model/HeaderModel',
	'strut/deck/Deck',
	'strut/slide_components/ComponentFactory',
	'common/Adapter',
	'tantaman/web/interactions/Clipboard',
	'./GlobalEvents',
	'tantaman/web/undo_support/CmdListFactory'],
	function(Backbone, Header, Deck, ComponentFactory, Adapter, Clipboard, GlobalEvents, CmdListFactory) {
		'use strict';

		function adaptStorageInterfaceForSavers(storageInterface) {
			return new Adapter(storageInterface, {
				store: 'savePresentation',
				ready: 'ready'
			});
		}

		return Backbone.Model.extend({
			initialize: function() {
				// is there a better way to do this?
				window.uiTestAcc = this;
				this.hasStorage = this.hasStorage.bind(this);

				this._fontState = window.sessionMeta.fontState || {};
				this._deck = new Deck();
				this._deck.on('change:customBackgrounds', function(deck, bgs) {
					this.trigger('change:customBackgrounds', this, bgs)
				}, this);
				this.addSlide();

				this.set('header', new Header(this.registry, this));

				this.set('modeId', 'slide-editor');

				this.exportable = new Adapter(this, {
					export: 'exportPresentation',
					identifier: 'fileName'
				});

				this.exportable.adapted = this;

				var savers = this.registry.getBest('tantaman.web.saver.AutoSavers');
				var storageInterface = this.registry.getBest('strut.StorageInterface');
				this.storageInterface = storageInterface;
				if (savers) {
					var self = this;
					storageInterface = adaptStorageInterfaceForSavers(storageInterface);
					this._exitSaver = savers.exitSaver(this.exportable, {
						identifier: 'strut-exitsave', 
						cb: function() {
							window.sessionMeta.lastPresentation = self.exportable.identifier()
						}
					});
					this._timedSaver = savers.timedSaver(this.exportable, 20000, storageInterface);
				}

				this.clipboard = new Clipboard();
				this._createMode();

				this._cmdList = CmdListFactory.managedInstance('editor');
				GlobalEvents.on('undo', this._cmdList.undo, this._cmdList);
				GlobalEvents.on('redo', this._cmdList.redo, this._cmdList);

				Backbone.on('etch:state', this._fontStateChanged, this);
			},

			changeActiveMode: function(modeId) {
				if (modeId != this.get('modeId')) {
					this.set('modeId', modeId);
					this._createMode();
				}
			},

			customStylesheet: function(css) {
				if (css == null) {
					return this._deck.get('customStylesheet');
				} else {
					this._deck.set('customStylesheet', css);
				}
			},

			dispose: function() {
				throw "EditorModel can not be disposed yet"
				this._exitSaver.dispose();
				this._timedSaver.dispose();
				Backbone.off(null, null, this);
			},

			validKey: function(name) {
				return this.storageInterface.validKey(name);
			},

			newPresentation: function() {
				var num = window.sessionMeta.num || 0;
				this.trigger('newPresentationDesired', num+1);
			},

			createPresentation: function(name) {
				var num = window.sessionMeta.num || 0;
				num += 1;
				window.sessionMeta.num = num;
				this.importPresentation({
	        		fileName: name,
	        		slides: []
	      		});
				this._deck.create();
			},

			/**
			 * see Deck.addCustomBgClassFor
			 */
			addCustomBgClassFor: function(color) {
				var result = this._deck.addCustomBgClassFor(color);
				if (!result.existed) {
					this.trigger('change:customBackgrounds', this, this._deck.get('customBackgrounds'));
				}
				return result;
			},

			customBackgrounds: function() {
				return this._deck.get('customBackgrounds');
			},

			importPresentation: function(rawObj) {
				this.storageInterface.revokeAllAttachmentURLs();
				// deck disposes iteself on import?
				// TODO: purge URL cache
				console.log('New file name: ' + rawObj.fileName);
				this._deck.import(rawObj);
			},

			hasStorage: function() {
				return this.storageInterface.ready();
			},

			exportPresentation: function(filename) {
				if (filename)
					this._deck.set('fileName', filename);
				var genid = this._deck.get('__genid');

				if (genid == null) genid = 0;
				else genid += 1;

				// Set the generation id for the deck.
				// A higher genid means its a newer version of the presentation.
				this._deck.set('__genid', genid);
				var obj = this._deck.toJSON(false, true);
				return obj;
			},

			fileName: function() {
				var fname = this._deck.get('fileName');
				if (fname == null) {
					// TODO...
					fname = 'presentation-unnamed';
					this._deck.set('fileName', fname);
				}

				return fname;
			},

			deck: function() {
				return this._deck;
			},

			cannedTransition: function(c) {
				if (c != null)
					this._deck.set('cannedTransition', c);
				else
					return this._deck.get('cannedTransition');
			},

			slides: function() {
				return this._deck.get('slides');
			},

			addSlide: function(index) {
				this._deck.create(index);
			},

			activeSlide: function() {
				return this._deck.get('activeSlide');
			},

			activeSlideIndex: function() {
				return this._deck.get('slides').indexOf(this._deck.get('activeSlide'));
			},

			addComponent: function(data, slide) {
				slide = slide || this._deck.get('activeSlide');
				if (slide) {
					if (typeof data.src == 'object' && data.src.file != null) {
						this._addEmbeddedComponent(data, slide);
					} else {
						var comp = ComponentFactory.instance.createModel(data, {
							fontStyles: this._fontState
						});
						slide.add(comp);
					}
				}
			},

			_addEmbeddedComponent: function(data, slide) {
				var embedData = data.src;
				var docKey = this.fileName();
				var attachKey = embedData.file.name;
				var self = this;
				this.storageInterface.storeAttachment(docKey,
				attachKey, embedData.file).then(function() {
					data.src = {
						docKey: docKey,
						attachKey: attachKey
					};
					self.addComponent(data, slide);
				}, function(error) {
					console.error(error);
					// TODO: report an error to our error reporting module...
				}).done();
			},

			_fontStateChanged: function(state) {
				_.extend(this._fontState, state);
				window.sessionMeta.fontState = this._fontState;
			},

			_createMode: function() {
				var modeId = this.get('modeId');
				var modeService = this.registry.getBest({
					interfaces: 'strut.EditMode',
					meta: { id: modeId }
				});

				if (modeService) {
					var prevMode = this.get('activeMode');
					if (prevMode)
						prevMode.close();
					this.set('activeMode', modeService.getMode(this, this.registry));
				}
			},

			constructor: function EditorModel(registry) {
				this.registry = registry;
				Backbone.Model.prototype.constructor.call(this);
			}
		});
	});
