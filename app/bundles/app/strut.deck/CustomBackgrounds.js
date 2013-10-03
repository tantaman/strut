define(['common/Calcium'],
function(Calcium) {
	return Calcium.Model.extend({
		initialize: function() {
			var bgs = this.get('bgs');
			if (!bgs) {
				bgs = [];
				this.set('bgs', bgs);
			}

			this._bgIndex = {};
			bgs.forEach(function(bg) {
				this._bgIndex[bg] = true;
			}, this);

			this._lastPrune = bgs.length;
		},

		/**
		 * Every time the user selects a new background color
		 * a class is generated for that color.
		 *
		 * In order to ensure that we don't keep creating
		 * classes and leaking ones that are no longer used,
		 * we occasinally need to prune out unused classes.
		 *
		 * @param {string} [ignoredKlass] class to ignore while pruning (optional)
		 */
		prune: function(ignoredKlass) {
			var slides = this.deck.get('slides');
			var dbg = this.deck.get('background');
			var dsurf = this.deck.get('surface');

			var usedClasses = {};
			var bgs = this.get('bgs');

			if (bgs.length == 0) return;

			slides.forEach(function(slide) {
				var bg = slide.get('background');
				if (bg)
					usedClasses[bg] = true;
				bg = slide.get('surface');
				if (bg)
					usedClasses[bg] = true;
			});

			if (dbg)
				usedClasses[dbg] = true;
			if (dsurf)
				usedClasses[dsurf] = true;
			
			for (var i = bgs.length - 1; i > -1; --i) {
				var klass = bgs[i].klass;
				if (usedClasses[klass] == null && klass !== ignoredKlass) {
					bgs.splice(i, 1);
					delete this._bgIndex[klass];
				}
			}

			this._lastPrune = bgs.length;
		},

		/**
		 * Takes in a color and adds a class for it, unless
		 * that class already exists.
		 * This returns an object that contains the 
		 * name of the created class and whether or not
		 * it already existed.
		 *
		 * @param {string} color hex string
		 * @returns {Object}
		 */
		add: function(color) {
			var klass = 'bg-custom-' + color.replace('#', '');

			var exists = this._bgIndex[klass];

			if (this.get('bgs').length - this._lastPrune > 10) {
				this.prune(klass);
			}

			if (!exists) {
				this.get('bgs').push({
					klass: klass,
					style: color
				});
				this._bgIndex[klass] = true;
				return {
					existed: false,
					klass: klass
				};
			} else {
				return {
					existed: true,
					klass: klass
				};
			}
		},

		constructor: function CustomBackgrounds() {
			Calcium.Model.prototype.constructor.apply(this, arguments);
		}
	});
});