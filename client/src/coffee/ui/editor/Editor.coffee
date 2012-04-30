define(["vendor/backbone",
		"./SlideEditor",
		"./TransitionEditor",
		"./Templates",
		"css!./res/css/Editor.css"],
(Backbone, SlideEditor, TransitionEditor, Templates, empty) ->
	editorId = 0
	Backbone.View.extend(
		className: "editor"
		initialize: () ->
			@id = editorId++
			@perspectives =
				slideEditor: new SlideEditor({model: @model})
				transitionEditor: new TransitionEditor({model: @model})

			@activePerspective = "slideEditor"

		render: () ->
			perspectives = _.map(@perspectives, (perspective, key) ->
				{
					perspective: key
					name: perspective.name
				}
			)
			@$el.html(Templates.Editor({
				id: @id
				perspectives: perspectives
			}))

			@$el.find(".dropdown-toggle").dropdown()

			$perspectivesContainer = @$el.find(".perspectives-container")
			_.each(@perspectives, (perspective, key) =>
				$perspectivesContainer.append(perspective.render())
				if key is @activePerspective
					perspective.$el.removeClass("disp-none")
			)

			@$el
	)
)