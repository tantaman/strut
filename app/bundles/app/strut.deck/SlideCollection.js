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
		 * @augments Backbone.Collection
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
			 * Update transition positions after slides have moved
			 *
			 * @param {Slide[]} slidesCopy
			 * @returns {SlideCollection} this
			 */
			slidesReorganized: function(slidesCopy) {
				var transitions = [];
				this.models.forEach(function(model, i) {
					transitions.push(slidesCopy[i].getPositionData());
				}, this);

				var silent = { silent: true };
				transitions.forEach(function(transition, i) {
					this.models[i].set(transition, silent);
				}, this);

				this.models.forEach(function(model, i) {
					model.set('index', i);
				});

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

