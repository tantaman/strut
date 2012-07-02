###*
* @module model.common_application
* @author Matt Crinklaw-Vogt
*###
define(["storage/FileStorage"],
(FileStorage) ->
	defaults =
		interval: 10

	###*
	* Auto saves a given model on a specified interval.
	* The model is expected to have a fileName attribute.
	* The model is saved by calling its toJSON method
	* @class model.common_application.AutoSave
	* @constructor
	* @param {Object} model The model to be saved
	* @param {Object} [options] Options specifying how the model should be saved
	*	@param {Integer} [options.interval] Inteval, in seconds, that the model should be saved.
	*###
	class AutoSaver
		constructor: (@model, @options) ->
			@options or (@options = {})
			_.defaults(@options, defaults)

		###*
		* Starts the auto save task if not already started
		* @method start
		*###
		start: ->
			if not @handle?
				@handle = setInterval(=> 
					@_save()
				, @options.interval * 1000)

		###*
		* Stops the auto save task if it is currently running
		* @method stop
		*###
		stop: ->
			if @handle?
				clearInterval(@handle)
				@handle = null

		_save: ->
			fileName = @model.get("fileName")
			if not fileName?
				return
				#if @lastAutoSave?
				#	FileStorage.remove(@lastAutoSave)
				#date = new Date()
				#fileName = 
				#	"AUTOSAVE-#{date.getDate()}/#{date.getMonth()+1} #{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"
				#@lastAutoSave = fileName
			FileStorage.save(fileName, @model.toJSON(false, true))
)