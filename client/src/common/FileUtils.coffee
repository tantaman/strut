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
)