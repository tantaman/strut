define([],
function() {

	/**
	 * @constructor
	 * @param {string} name
	 * @param {string} src
	 * @param {number} aspect
	 * @returns {PlatonicShape}
	 */
	function PlatonicShape(name, src, aspect) {
		if (!(this instanceof PlatonicShape))
			return new PlatonicShape(name, src, aspect);

		this.name = name;
		var loc = window.location.href;
		var hashIdx = loc.indexOf('#');
		var finalIdx;
		if (hashIdx != -1) {
			loc = loc.substring(0, hashIdx);
		}
		finalIdx = loc.lastIndexOf('/');

		if (finalIdx != -1)
			loc = loc.substring(0, finalIdx);

		this.src = loc
			+ '/preview_export/shapes/' + src;
		this.aspect = aspect;
	}

	/**
	 * Standard collection of shapes.
	 *
	 * @constructor
	 */
	function ShapeCollection() {
		this.title = 'shapes';
		this.shapes = [
			PlatonicShape('square', 'square.svg', 1),
			PlatonicShape('triangle', 'triangle.svg', 1),
			PlatonicShape('circle', 'circle.svg', 1),
			PlatonicShape('hexagon', 'hexagon.svg', 1),
			PlatonicShape('pentagon', 'pentagon.svg', 1),
			PlatonicShape('star', 'star.svg', 1),
			PlatonicShape('pacman', 'pacman.svg', 1),
			PlatonicShape('heart', 'heart.svg', 1),
			PlatonicShape('infinity', 'infinity.svg', 1),
			PlatonicShape('yin yang', 'yinyang.svg', 1),
			PlatonicShape('glasses', 'glasses.svg', 1)
		];
	}

	ShapeCollection.prototype = {
		on: function() {}
	};

	return ShapeCollection;
});