define(['libs/backbone', 'css!styles/transition_editor/slideTable.css'],
function(Backbone, empty) {
	return Backbone.View.extend({
		className: 'slideTable'

		/*
		TODO: render the slides...
		The button bar will need to be taken care of
		through something else...
		Register button bars with a given mode?

		strut.TransitionButtonProviders??

		My model is a TransitionEditorModel
		which contains a reference to the editorModel
		and registry.
		*/
	});
});