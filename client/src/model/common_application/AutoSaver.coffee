define(["storage/FileStorage"],
(FileStorage) ->
	defaults =
		interval: 10
	class AutoSaver
		constructor: (@deck, @options) ->
			@options or (@options = {})
			_.defaults(@options, defaults)

		start: ->
			if not @handle?
				@handle = setInterval(=> 
					@_save()
				, @options.interval * 1000)

		stop: ->
			if @handle?
				clearInterval(@handle)
				@handle = null

		_save: ->
			fileName = @deck.get("fileName")
			if not fileName?
				return
				#if @lastAutoSave?
				#	FileStorage.remove(@lastAutoSave)
				#date = new Date()
				#fileName = 
				#	"AUTOSAVE-#{date.getDate()}/#{date.getMonth()+1} #{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"
				#@lastAutoSave = fileName
			FileStorage.save(fileName, @deck.toJSON(false, true))
)