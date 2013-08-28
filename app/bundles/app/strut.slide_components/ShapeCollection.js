define(['tantaman/web/css_manip/CssManip'],
function(CssManip) {
	// grab the shape stylesheet
	// get all of its rules
	// pull out the shapes.  Split out their names and class name.
	function PlatonicShape(name, klass) {
		this.name = name;
		this.klass = klass;
	}

	function ShapeCollection() {
		this.title = 'shapes';
		
		var sheets = document.styleSheets;
		var shapesSheet;
		for (var i = 0; i < sheets.length; ++i) {
			var sheet = sheets[i];
			if (sheet.title == 'shapesSheet') {
				shapesSheet = sheet;
				break;
			}
		}

		if (!shapesSheet)
			throw 'Unable to find shapessheet';

		this.shapes = extractShapes(shapesSheet);

		console.log('Extracted shapes:');
		console.log(this.shapes);
	}

	ShapeCollection.prototype = {
		on: function() {},

	};

	var classPrefix = '.shape-';
	var classPrefixLen = classPrefix.length;
	function extractShapes(sheet) {
		var shapes = [];
		var shapeClasses = CssManip.extractClasses(sheet);
		for (var shapeClass in shapeClasses) {
			var shapeName = shapeClass.substring(classPrefixLen);
			shapes.push(new PlatonicShape(shapeName, shapeClass));
		}

		return shapes;
	}

	return ShapeCollection;
});