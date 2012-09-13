###
@author Matt Crinklaw-Vot
###
define(["vendor/amd/backbone",
		"./Templates",],
(Backbone, Templates) ->
	Backbone.View.extend(
		className: "rawTextImporter modal"
		events:
			"click .ok": "okClicked"
			"hidden": "hidden"

		initialize: () ->

		show: (cb, val) ->
			@cb = cb
			if val?
				@$txtArea.val(val)

			@$el.modal("show")

		###*
		Makes the text contained in the textarea
		downloadable.
		*###
		makeDownloadable: () ->
			MIME_TYPE = 'application\/json'
			blob = new Blob([@$txtArea.val()], type: MIME_TYPE)
			a = $('<a class="downloadLink btn btn-inverse" title="Download"><i class="icon-download-alt icon-white"></i></a>')[0]
			a.download = 'presentation.json' # needs a real name
			a.href = window.URL.createObjectURL(blob)
			a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':')

			@$el.find('.modal-footer').prepend(a)

		okClicked: () ->
			if @cb?
				@cb(@$txtArea.val())
			@$el.modal("hide")

		hidden: () ->
			if @$txtArea?
				@$txtArea.val("")
			@_cleanUpDownloadLink()

		_cleanUpDownloadLink: () ->
			$prevLink = @$el.find('.downloadLink')
			if ($prevLink.length != 0)
				console.log('Removing prev link')
				window.URL.revokeObjectURL($prevLink.attr('href'))
				$prevLink.remove()

		render: () ->
			@$el.html(Templates.RawTextImporter())
			@$el.modal()
			@$el.modal("hide")
			@$txtArea = @$el.find("textarea")
			@$el
	)
)