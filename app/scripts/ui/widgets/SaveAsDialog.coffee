###
@author Matt Crinklaw-Vot
###
define(["backbone",
		"./OpenDialog"],
(Backbone, OpenDialog) ->
	OpenDialog.extend(
		initialize: () ->
			OpenDialog.prototype.initialize.apply(@, arguments)

		fileClicked: (e) ->
			OpenDialog.prototype.fileClicked.call(@, e)
			@$nameInput.val($(e.currentTarget).text())

		okClicked: () ->
			console.log @$nameInput.val()
			if @cb?
				@cb(@$nameInput.val())
			@$el.modal("hide")

		__template: () ->
			JST["widgets/SaveAsDialog"]

		_renderPartial: () ->
			OpenDialog.prototype._renderPartial.call(@)
			@$nameInput = @$el.find("input")

		render: () ->
			@_renderPartial()
			@$el.modal()
			@$el.modal("hide")
			@$el
	)
)