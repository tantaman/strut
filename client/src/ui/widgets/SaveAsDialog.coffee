###
@author Matt Crinklaw-Vot
###
define(["vendor/amd/backbone",
		"./Templates",
		"./OpenDialog"],
(Backbone, Templates, OpenDialog) ->
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
			Templates.SaveAsDialog

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