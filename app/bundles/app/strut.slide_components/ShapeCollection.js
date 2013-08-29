define([],
function() {
	function PlatonicShape(name, klass) {
		this.name = name;
		this.klass = klass;
	}

	function ShapeCollection() {
		this.title = 'shapes';
		this.shapes = [];
	}

	ShapeCollection.prototype = {
		on: function() {},
		
	};

	return ShapeCollection;
});