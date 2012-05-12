define(
	round: (num, dec) ->
		dec? or (dec = 0)
		factor = Math.pow(10, dec)
		Math.round(num * factor) / factor
)