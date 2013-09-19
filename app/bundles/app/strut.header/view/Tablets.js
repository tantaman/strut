define(['tantaman/web/widgets/Tablets',
		'../model/TabletsModel'],
function(Tablets, TabletsModel) {
	function EditorTablets() {
		this._tablets = 
		new Tablets({ 
					model: new TabletsModel(),
					tabs: [
						{icon: 'markdown-white',
						name: 'Markdown',
						key: 'markdown'},

						{icon: 'plus icon-white',
						name: 'Class',
						key: 'class'},

						{icon: 'edit icon-white',
						name: 'CSS',
						key: 'css'}
					],
					template: JST['strut.slide_editor/Tablets']
				});
		this.$el = this._tablets.$el;
	}

	EditorTablets.prototype = {
		dispose: function() {
			this._tablets.dispose();
		},

		render: function() {
			this._tablets.render();
			return this;
		}
	};

	return EditorTablets;
});