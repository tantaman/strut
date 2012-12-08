###
@author Matt Crinklaw-Vot
###
define(["backbone",
		'common/FileUtils'],
(Backbone, FileUtils) ->
	# TODO: should be more configurable.  Right now this only accepts JSON and you can't configure the filename.
	Backbone.View.extend(
		className: "downloadDialog modal"
		events:
			"click .ok": "okClicked"
			"hidden": "hidden"

		initialize: () ->

		show: (val, name) ->
			if val?
				@_val = val
				@_makeDownloadable(name)

			@$el.modal("show")

		###*
		Makes a download link for _val
		*###
		_makeDownloadable: (name) ->
			###
			MIME_TYPE = 'application\/json'
			blob = new Blob(@_val, type: MIME_TYPE)
			a = @$download[0]
			a.download = 'presentation.json' # needs a real name
			a.href = window.URL.createObjectURL(blob)
			a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':')
			###
			attrs = FileUtils.createDownloadAttrs('application\/json', @_val, name + '.json')
			a = @$download[0]
			a.download = attrs.download
			a.href = attrs.href
			a.dataset.downloadurl = attrs.downloadurl

		okClicked: () ->
			@$el.modal("hide")

		hidden: () ->
			@_val = ''
			@_cleanUpDownloadLink()

		_cleanUpDownloadLink: () ->
			if @$download?
				window.URL.revokeObjectURL(@$download.attr('href'))

		render: () ->
			@$el.html(JST["widgets/DownloadDialog"]())
			@$el.modal()
			@$el.modal("hide")
			@$download = @$el.find('.downloadLink')
			@$el
	)
)