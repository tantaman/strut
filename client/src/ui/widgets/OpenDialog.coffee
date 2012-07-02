###
@author Matt Crinklaw-Vot
###
define(["vendor/amd/backbone",
		"./Templates",
		"storage/FileStorage",
		"css!./res/css/OpenDialog.css"],
(Backbone, Templates, FileStorage, empty) ->
	Backbone.View.extend(
		className: "openDialog modal"
		events: () ->
			"click .ok": "okClicked"
			"click li > a > span": "fileClicked"
			"click li > a > button": "deleteClicked"

		initialize: () ->

		show: (cb, val) ->
			@_renderPartial()
			@cb = cb
			@$el.modal("show")

		okClicked: () ->
			if @cb?
				@cb(@$el.find(".active span").text())
			@$el.modal("hide")

		fileClicked: (e) ->
			@$el.find(".active").removeClass("active")
			$(e.currentTarget).parent().parent().addClass("active")

		deleteClicked: (e) ->
			$tgt = $(e.currentTarget)
			fileName = $tgt.siblings("span").text()
			FileStorage.remove(fileName)

			$tgt.parent().parent().remove()


		_renderPartial: () ->
			@$el.html(@__template()({fileNames: FileStorage.fileNames()}))

		__template: () ->
			Templates.OpenDialog

		render: () ->
			@_renderPartial()
			@$el.modal()
			@$el.modal("hide")
			@$el
	)
)