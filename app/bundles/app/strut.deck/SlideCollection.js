/**
 * @author Matt Crinklaw-Vogt
 */
define(["common/Calcium", "./Slide"],
	function(Backbone, Slide) {

		// TODO Is this even used anywhere? If not, should probably be deleted.
		/**
		 * Comparator function for SlideCollection. Compares slides by their indexes.
		 * @see Backbone.Collection.comparator
		 *
		 * @param {Slide} l
		 * @param {Slide} r
		 * @returns {number}
		 */
		var slideComparator = function(l, r) {
			return l.get("index") - r.get("index");
		};

		/**
		 * @class SlideCollection
		 */
		return Backbone.Collection.extend({
			model: Slide,

			/**
			 * Initialize collection model.
			 */
			initialize: function() {
				this.on("add", this._updateIndexes, this);
				this.on("remove", this._updateIndexes, this);
			},

			/**
			 * Update slide indexes on any changes to the contents of collection.
			 *
			 * @private
			 */
			_updateIndexes: function() {
				this.models.forEach(function(model, idx) {
					return model.set("index", idx);
				});
			},

			/**
			 * Sort collection by it's indexes.
			 *
			 * @param {Object=} opts
			 * @returns {SlideCollection} this
			 */
			sort: function(opts) {
				opts = opts || {};
				var swapped = {};
				this.models.forEach(function(model, idx) {
					var num;
					num = model.get("index");
					if (num !== idx && !swapped[num]) {
						swapped[num] = true;
						swapped[idx] = true;
						this._swapTransitionPositions(model, this.models[num]);
					}
				}, this);
				return this;
			},

			/**
			 * Change position of slides in SlideWell if their order is changed in collection.
			 *
			 * @param {Slide} l
			 * @param {Slide} r
			 * @private
			 */
			_swapTransitionPositions: function(l, r) {
				var silent, tempPosData;
				tempPosData = l.getPositionData();
				silent = {
					silent: true
				};
				l.set(r.getPositionData(), silent);
				r.set(tempPosData, silent);
			}
		});
	});

