define(->
	FileUtils =
		baseName: (path, extension) ->
			if (path[path.length - 1] is "/")
				path = path.substring(0, path.length - 1)

			idx = path.lastIndexOf("/")
			if idx isnt -1 and idx + 1 < path.length
				path = path.substring(idx+1, path.length)

			if extension?
				idx = path.lastIndexOf(extension)
				if idx + extension.length is path.length
					path = path.substring(0, idx)

			path

		# TODO: make a generic type that returns the mime type
		imageType: (uri) ->
			if (uri.indexOf("data:") is 0)
				idx = uri.indexOf(";")
				uri.substring(11, idx).toUpperCase()
			else
				FileUtils.extension(uri)

		extension: (uri) ->
			idx = uri.lastIndexOf(".")
			if idx isnt -1 and idx+1 < uri.length
				extension = uri.substring(idx+1, uri.length)
				idx = extension.lastIndexOf("?")
				if idx isnt -1
					extension = extension.substring(0, idx)
				extension.toUpperCase()
			else
				""

		type: (extension) ->
			switch extension
				when "MP4" then "video/mp4"
				when "WEBM" then "video/webm"
				when "OGG" then "video/ogg"
				else ""
)