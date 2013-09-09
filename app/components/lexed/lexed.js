;(function(glob, undefined) {
	'use strict'

	function buildRules(ruleMap) {
		var ruleKeys = Object.keys(ruleMap);

		var rules = [];
		ruleKeys.forEach(function(ruleKey) {
			if (ruleKey[0] == '^') {
				throw "rules with ^ as their first character are currently unsupported."
			} else {
				var rule = {
					regex: new RegExp('^(' + ruleKey + ')'),
					action: ruleMap[ruleKey]
				};

				rules.push(rule);
			}
		});

		return rules;
	}

	function normalize(ruleMap, statedRuleMap) {
		ruleMap || (ruleMap = {});
		statedRuleMap || (statedRuleMap = {});

		var initial = statedRuleMap.initial;
		if (initial) {
			for (var key in ruleMap) {
				initial[key] = ruleMap[key];
			}
		} else {
			statedRuleMap.initial = ruleMap;
		}

		return statedRuleMap;
	}

	function Lexed(textStream, ruleMap, statedRuleMap) {
		if (typeof textStream === 'string') {
			textStream = new Lexed.StringStream(textStream);
		}

		this._stream = textStream;
		this._currString = '';
		this._state = 'initial';

		ruleMap = normalize(ruleMap, statedRuleMap);
		
		this._rules = {};

		for (var state in ruleMap) {
			this._rules[state] = buildRules(ruleMap[state]);
		}
	}

	Lexed.EOF = {
		toString: function() {
			return "eof"
		}
	};
	Lexed.IGNORE = {
		toString: function() {
			return "ignored";
		}
	};
	Lexed.NO_MATCH = {msg: "NO SUITABLE CONTINUOUS MATCH"};
	Lexed.StringStream = function StringStream(string) {
		this._string = string;
	};

	Lexed.StringStream.prototype = {
		nextString: function() {
			var temp = this._string;
			this._string = undefined;
			return temp;
		}
	}

	Lexed.prototype = {
		lex: function() {
			var input = this._getInput();
			if (!input && (this._currString == '' || !this._currString))
				return Lexed.EOF;

			this._currString += input;

			var match;
			// Doing this iteratively even though it is
			// a bit uglier than the recursive solution.
			var index;
			var rules = this._rules[this._state];
			while (!match) {
				for (var i = 0; i < rules.length; ++i) {
					var rule = rules[i];
					var tempMatch = rule.regex.exec(this._currString);
					if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
						match = tempMatch;
						index = i;
					}
				}

				if (!match) {
					var input = this._getInput(true);
					if (!input) {
						throw Lexed.NO_MATCH;
					}
					this._currString += input;
				}
			}

			this._currString = this._currString.substring(match[0].length);

			var rule = rules[index];
			if (typeof rule.action === 'function') {
				var result = rule.action(match[0], this);
				if (result === Lexed.IGNORE)
					return this.lex();
				return result;
			} else if (rule.action === Lexed.IGNORE) {
				var t;
				return this.lex();
			} else {
				return rule.action;
			}
		},

		_getInput: function(needsInput) {
			if (!this._currString || this._currString == '' || needsInput) {
				return this._stream.nextString();
			} else {
				return '';
			}
		},

		state: function(newState) {
			if (!newState)
				return this._state;
			this._state = newState;
		}
	};

	if (typeof define === 'function') {
		define(function() {
			return Lexed;
		});
	} else {
		glob.Lexed = Lexed;
	}
}(this));