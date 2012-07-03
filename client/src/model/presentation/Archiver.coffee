define(["vendor/amd/jszip",
		"./Deck",
		# egh... Someone is in the wrong spot.  Either impress renderer or archiver.
		"ui/impress_renderer/ImpressRenderer",
		"common/FileUtils"], 
(JSZip, Deck, ImpressRenderer, FileUtils) ->
	defaults =
		includeImages: true
		includeFonts: true

	class Archiver
		constructor: (@presentation, @options) ->
			@options or (@options = {})
			@canvas = $("<canvas></canvas>")[0]
			@_archivedImages = {}
			@_imageIdx = 0
			_.defaults(@options, defaults)

		create: () ->
			@archive = new JSZip()
			@previewExportDir = @archive.folder("preview_export")

			@imagesDir = @previewExportDir.folder("images")
			@scriptsDir = @previewExportDir.folder("scripts")
			@fontsDir = @previewExportDir.folder("fonts")
			@cssDir = @previewExportDir.folder("css")

			presentationCopy = new Deck()

			# hmm.. we should update the impress renderer
			# to just function on the raw object
			# so we don't have to re-import
			presentationCopy.import(@presentation.toJSON(false, true))

			presentationCopy.get("slides").each((slide) =>
				@processComponents(slide.get("components"))
			)

			showStr = "<!doctype html><html>" \
			+ ImpressRenderer.render(presentationCopy.attributes) + "</html>"

			@_archiveIndexHtml(showStr)
			@_archiveScripts()
			@_archiveFonts()
			@_archiveCss()

			# Clone presentation
			# 	via toJSON, new Deck(), deck.import(json)
			# descend into presentation
			# get image datas via drawing them to a canvas of naturalWidth, naturalHeight size
				# svgs....?????
			# update image urls
			# put images in zip
			# render presentation to html
			# put html in zip
			# put css in zip
			# put js in zip
			# put fonts in zip
			# return "download ready" link
			@_archivedImages = {}
			@archive.generate();

		processComponents: (components) ->
			components.forEach((component) =>
				@processComponent(component)
			)

		processComponent: (component) ->
			if component.get("type") is "ImageModel"
				if @options.includeImages
					@_archiveImage(component)

		_archiveIndexHtml: (str) ->
			@archive.file("index.html", str);

		# use the !text plugin to load these?
		_archiveScripts: () ->

		# how could we archive fonts though...?
		_archiveFonts: () ->

		_archiveCss: () ->

		_archiveImage: (component) ->
			# TODO: check the origin on the image
			# if cross origin then just link it?
			if not @_archivedImages[component.get("src")]
				@_archivedImages[component.get("src")] = true

				img = component.cachedImage
				@canvas.width = img.naturalWidth
				@canvas.height = img.naturalHeight

				@canvas.getContext("2d").drawImage(img, 0, 0)

				fileName = @_imageIdx + FileUtils.baseName(component.get("src"))
				@imagesDir.file(fileName, 
					@canvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, ""),
					base64: true)
				component.set("src", "preview_export/images/" + fileName)


	###
		var zip = new JSZip();
		zip.file("Hello.txt", "Hello World\n");
		var img = zip.folder("images");
		img.file("smile.gif", imgData, {base64: true});
		var content = zip.generate();
		location.href="data:application/zip;base64,"+content;
      ###

      # interesting reads:
      # http://html5-demos.appspot.com/static/filesystem/generatingResourceURIs.html
      # http://updates.html5rocks.com/2011/08/Downloading-resources-in-HTML5-a-download
      # http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html
)