define(['libs/backbone',
		'strut/header/model/HeaderModel',
		'strut/deck/Deck',
		'strut/slide_components/ComponentFactory',
		'common/Adapter',
		'tantaman/web/interactions/Clipboard',
		'./GlobalEvents',
		'tantaman/web/undo_support/CmdListFactory'],
function(Backbone,
		 Header,
		 Deck,
		 ComponentFactory,
		 Adapter,
		 Clipboard,
		 GlobalEvents,
		 CmdListFactory) {
	'use strict';

	function adaptStorageInterfaceForSavers(storageInterface) {
		return new Adapter(storageInterface, {
			store: 'savePresentation'
		});
	}

	return Backbone.Model.extend({
		initialize: function() {
			// is there a better way to do this?
			window.uiTestAcc = this;

			this._deck = new Deck();
			this.addSlide();

			this.set('header', new Header(this.registry, this));

			this.set('modeId', 'slide-editor');

			this.exportable = new Adapter(this, {
				export: 'exportPresentation',
				identifier: 'fileName'
			});

			this.exportable.adapted = this;

			var savers = this.registry.getBest('tantaman.web.saver.AutoSavers');
			if (savers) {
				var storageInterface = null;
				var storageInterface = this.registry.getBest('strut.StorageInterface');
				storageInterface = adaptStorageInterfaceForSavers(storageInterface);
				this._exitSaver = savers.exitSaver(this.exportable, storageInterface);
				this._timedSaver = savers.timedSaver(this.exportable, 10000, storageInterface);
			}

			this.clipboard = new Clipboard();
			this._createMode();

			this._cmdList = CmdListFactory.managedInstance('editor');
			GlobalEvents.on('undo', this._cmdList.undo, this._cmdList);
			GlobalEvents.on('redo', this._cmdList.redo, this._cmdList);
		},

		changeActiveMode: function(modeId) {
			if (modeId != this.get('modeId')) {
				this.set('modeId', modeId);
				this._createMode();
			}
		},

		dispose: function() {
			throw "EditorModel can not be disposed yet"
			this._exitSaver.dispose();
			this._timedSaver.dispose();
		},

		newPresentation: function() {
			var num = window.sessionMeta.num || 0;

			num += 1;
			window.sessionMeta.num = num;

			this.importPresentation({
        		fileName: "presentation-" + num,
        		slides: []
      		});
      		this._deck.newSlide();
		},

		importPresentation: function(rawObj) {
			// deck disposes iteself on import?
			console.log('New file name: ' + rawObj.fileName);
			this._deck.import(rawObj);
		},

		exportPresentation: function(filename) {
			if (filename)
				this._deck.set('fileName', filename);
			return this._deck.toJSON(false, true);
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

		slides: function() {
			return this._deck.get('slides');
		},

		addSlide: function(index) {
			this._deck.newSlide(index);
		},

		activeSlide: function() {
			return this._deck.get('activeSlide');
		},

		activeSlideIndex: function() {
			return this._deck.get('slides').indexOf(this._deck.get('activeSlide'));
		},

		addComponent: function(type) {
			var slide = this._deck.get('activeSlide');
			if (slide) {
				var comp = ComponentFactory.instance.createModel(type);
				slide.add(comp);
			}
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
