define(['tantaman/web/css_manip/CssManip'],
function(CassManip) {
	var el = CassManip.getStyleElem({
		id: 'customBackgrounds',
		create: true
	});

	function CustomBgStylesheet(editorModel) {
		this.model = editorModel;
		editorModel.on('change:customBackgrounds', this.render, this);
	}

	CustomBgStylesheet.prototype = {
		render: function(m, customBgs) {
			if (!customBgs) return;
			el.innerHTML = 
				JST['strut.editor/CustomBgStylesheet'](customBgs.get('bgs'));
		},

		dispose: function() {
			this.model.off(null, null, this);
		}
	}

	return CustomBgStylesheet;
});