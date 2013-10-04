define(['tantaman/web/css_manip/CssManip'],
function(CassManip) {
	var el = CassManip.getStyleElem({
		id: 'customBackgrounds',
		create: true
	});

	/**
	 * This is essentially a view class that
	 * render the stylesheet of background classes whenever
	 * new background classes are created.
	 *
	 * @param {EditorModel} editorModel
	 */
	function CustomBgStylesheet(editorModel) {
		this.model = editorModel;
		editorModel.on('change:customBackgrounds', this.render, this);
	}

	CustomBgStylesheet.prototype = {
		/**
		 * render the stylesheet.  Should never
		 * need to be called explicitly.
		 */
		render: function(m, customBgs) {
			if (!customBgs) return;
			el.innerHTML = 
				JST['strut.presentation_generator/CustomBgStylesheet'](customBgs.get('bgs'));
		},

		/**
		 * Unregister from the model so this component
		 * can be cleaned up.
		 */
		dispose: function() {
			this.model.off(null, null, this);
		}
	}

	return CustomBgStylesheet;
});