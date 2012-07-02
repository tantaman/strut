define(["vendor/amd/jszip"],
(JSZip) ->
	defaults =
		includeImages: false
		includeFonts: true

	Archiver =
		createArchive: (presentation, options) ->
			options or (options = {})
			_.defaults(options, defaults)

			archive = new JSZip()
			presentationCopy = new Deck()

			# hmm.. we should update the impress renderer
			# to just function on the raw object
			# so we don't have to re-import
			presentationCopy.import(presentation.toJSON(false, true))

			presentationCopy.get("slides").each((slide) =>
				@processComponents(slide.get("components"), archive, options)
			)

			showStr = "<!doctype html><html>" \
			+ ImpressRenderer.render(@model.attributes) + "</html>"

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

		processComponents: (components, archive, options) ->
			components.forEach((component) =>
				@processComponent(component, archive, options)
			)

		processComponent: (component, archive, options) ->


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