###
@author Matt Crinklaw-Vot
###
define(["backbone",
		"storage/FileStorage",
		"css!styles/widgets/OpenDialog.css"],
(Backbone, FileStorage, empty) ->
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
			JST["widgets/OpenDialog"]

		render: () ->
			@_renderPartial()
			@$el.modal()
			@$el.modal("hide")
			@$el
	)
)