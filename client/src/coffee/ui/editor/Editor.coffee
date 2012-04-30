define(["vendor/backbone",
		"./SlideEditor",
		"./TransitionEditor",
		"./Templates",
		"css!./res/css/Editor.css"],
(Backbone, SlideEditor, TransitionEditor, Templates, empty) ->
	editorId = 0

	menuOptions =
		new: (e) ->
		open: (e) ->
		openRecent: (e) ->
		save: (e) ->
		saveAs: (e) ->
		undo: (e) ->
			@model.undo()
		redo: (e) ->
			@model.redo()
		cut: (e) ->
		copy: (e) ->
		paste: (e) ->

	Backbone.View.extend(
		className: "editor"
		events:
			"click .dropdown-menu > li > a": "menuItemSelected"

		initialize: () ->
			@id = editorId++
			@perspectives =
				slideEditor: new SlideEditor({model: @model})
				transitionEditor: new TransitionEditor({model: @model})

			@activePerspective = "slideEditor"

		menuItemSelected: (e) ->
			$target = $(e.target)
			option = $target.attr("data-option")
			menuOptions[option].call(@, e)

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