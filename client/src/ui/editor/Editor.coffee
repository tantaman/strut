###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./SlideEditor",
		"./TransitionEditor",
		"./Templates",
		"ui/impress_renderer/ImpressRenderer",
		"ui/widgets/RawTextImporter",
		"css!./res/css/Editor.css"],
(Backbone, SlideEditor, TransitionEditor, Templates, ImpressRenderer, RawTextModal, empty) ->
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
		transitionEditor: (e) ->
			@changePerspective(e, {perspective: "transitionEditor"})
		slideEditor: (e) ->
			@changePerspective(e, {perspective: "slideEditor"})
		preview: (e) ->
			@$el.trigger("preview")
		exportJSON: (e) ->
			@rawTextModal.show(null, JSON.stringify(@model.toJSON(false, true)))

		importJSON: (e) ->
			@rawTextModal.show((json) =>
				@model.import(JSON.parse(json))
			)

	Backbone.View.extend(
		className: "editor"
		events:
			"click .menuBar .dropdown-menu > li": "menuItemSelected"
			"changePerspective": "changePerspective"
			"preview": "renderPreview"

		initialize: () ->
			@id = editorId++
			@perspectives =
				slideEditor: new SlideEditor({model: @model})
				transitionEditor: new TransitionEditor({model: @model})

			@activePerspective = "slideEditor"
			@model.undoHistory.on("updated", @undoHistoryChanged, @)

		undoHistoryChanged: () ->
			undoName = @model.undoHistory.undoName()
			redoName = @model.undoHistory.redoName()
			if undoName isnt ""
				$lbl = @$el.find(".undoName")
				$lbl.text(undoName)
				$lbl.removeClass("disp-none")
			else
				@$el.find(".undoName").addClass("disp-none")
			if redoName isnt ""
				$lbl = @$el.find(".redoName")
				$lbl.text(redoName)
				$lbl.removeClass("disp-none")
			else
				@$el.find(".redoName").addClass("disp-none")

		renderPreview: () ->
			showStr = ImpressRenderer.render(@model.attributes)
			newWind = window.open("data:text/html;charset=utf-8," + escape(showStr))
			#frame = newWind.document.getElementById("presentation")
			#frame.src = "data:text/html;charset=utf-8," + escape(showStr)

		changePerspective: (e, data) ->
			@activePerspective = data.perspective
			_.each(@perspectives, (perspective, key) =>
				if key is @activePerspective
					perspective.show()
				else
					perspective.hide()
			)

		menuItemSelected: (e) ->
			$target = $(e.currentTarget)
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
					perspective.show()
				else
					perspective.$el.addClass("disp-none")
			)

			@undoHistoryChanged()
			@rawTextModal = new RawTextModal()
			@$el.append(@rawTextModal.render())

			@$el
	)
)