define(['backbone',
		'common/FileUtils'],
(Backbone, FileUtils) ->
	Backbone.View.extend(
		className: 'dispNone'
		
		initialize: (triggerElem, @infoProvider) ->
			if triggerElem?
				triggerElem.on('click', @trigger.bind(@))

		trigger: (info) ->
			# make the download
			# click the download
			dlInfo = info or @infoProvider()
			attrs = FileUtils.createDownloadAttrs(dlInfo.mimeType, dlInfo.value, dlInfo.name)
			a = @$a[0]
			a.download = attrs.download
			a.href = attrs.href
			a.dataset.downloadurl = attrs.downloadurl
			@$a.click()

		cleanUpDownloadLink: ->
			window.URL.revokeObjectURL(@$a.attr('href'))

		remove: ->
			cleanUpDownloadLink()

		render: ->
			@$a = $('<a target="_blank"></a>')
			@$el.html(@$a)
	)
)