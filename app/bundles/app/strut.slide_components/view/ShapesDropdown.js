define(['tantaman/web/widgets/Dropdown',
		'tantaman/web/widgets/Utils'],
function(Dropdown, Utils) {
	function ShapesDropdown(shapes, template, options) {
		Dropdown.apply(this, arguments);
		this._editorModel = options.editorModel;
	}

	var proto = ShapesDropdown.prototype = Object.create(Dropdown.prototype);

	proto._selected = function(e) {
		this._editorModel.addComponent({
			src: e.currentTarget.dataset.src,
			type: 'Image'
		});
	}

	return ShapesDropdown;
});