define(['tantaman/web/widgets/Dropdown',
	'tantaman/web/widgets/Utils'],
	function(Dropdown, Utils) {

		__extends(ShapesDropdown, Dropdown);

		/**
		 * @class ShapesDropdown
		 * @extends Dropdown
		 * @param {ShapeCollection} shapes
		 * @param template
		 * @param {Object} options
		 */
		function ShapesDropdown(shapes, template, options) {
			Dropdown.apply(this, arguments);
			this._editorModel = options.editorModel;
		}

		/**
		 * React on item selection.
		 *
		 * @param {Event} e
		 * @private
		 */
		ShapesDropdown.prototype._selected = function(e) {
			this._editorModel.addComponent({
				src: e.currentTarget.dataset.src,
				type: 'Image'
			});
		}

		return ShapesDropdown;
	});