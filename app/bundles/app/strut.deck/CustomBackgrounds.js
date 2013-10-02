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
		},

		prune: function(slides, dbg, dsurf) {
			var usedClasses = {};
			var bgs = this.get('bgs');

			if (bgs.length == 0) return;

			slides.forEach(function(slide) {
				var bg = slide.background;
				if (bg)
					usedClasses[bg] = true;
				bg = slide.surface;
				if (bg)
					usedClasses[bg] = true;
			});

			if (dbg)
				usedClasses[dbg] = true;
			if (dsurf)
				usedClasses[dsurf] = true;
			
			for (var i = bgs.length - 1; i > -1; --i) {
				var bg = bgs[i];
				if (usedClasses[bg] == null) {
					bgs.splice(i, 1);
				}
			}
		},

		// TODO: monitor size changes and prune after a given number
		// of additions since the last prune.
		add: function(color) {
			color = color.replace('#', '');
			var klass = 'bg-custom-' + color;

			var exists = this._bgIndex[klass];

			if (!exists) {
				this.get('bgs').push(klass);
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