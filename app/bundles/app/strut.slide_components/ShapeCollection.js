define([],
function() {

	/**
	 * @constructor
	 * @param {String} name
	 * @param {String} src
	 * @param {number} aspect
	 * @returns {PlatonicShape}
	 */
	function PlatonicShape(name, src, aspect) {
		if (!(this instanceof PlatonicShape))
			return new PlatonicShape(name, src, aspect);

		this.name = name;
		this.src = 'preview_export/shapes/' + src;
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