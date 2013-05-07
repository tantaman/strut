/*
same sorta codes...
*/
define(['tantaman/web/widgets/StubView'],
function(StubView) {
	function SurfaceBackgroundProvider(editorModel) {
		this._view = new StubView($('<div class="btn">Surface</div>'));
		// bind to view events
	}

	SurfaceBackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		dispose: function() {
			
		}
	};

	return SurfaceBackgroundProvider;
});