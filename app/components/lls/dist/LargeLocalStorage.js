(function(glob) {
	var undefined = {}.a;

	function definition(Q) {
	

/**
@author Matt Crinklaw-Vogt
*/
function PipeContext(handlers, nextMehod, end) {
	this._handlers = handlers;
	this._next = nextMehod;
	this._end = end;

	this._i = 0;
}

PipeContext.prototype = {
	next: function() {
		// var args = Array.prototype.slice.call(arguments, 0);
		// args.unshift(this);
		this.__pipectx = this;
		return this._next.apply(this, arguments);
	},

	_nextHandler: function() {
		if (this._i >= this._handlers.length) return this._end;

		var handler = this._handlers[this._i].handler;
		this._i += 1;
		return handler;
	},

	length: function() {
		return this._handlers.length;
	}
};

function indexOfHandler(handlers, len, target) {
	for (var i = 0; i < len; ++i) {
		var handler = handlers[i];
		if (handler.name === target || handler.handler === target) {
			return i;
		}
	}

	return -1;
}

function forward(ctx) {
	return this.__pipectx.next.apply(this.__pipectx, arguments);
}

function coerce(methodNames, handler) {
	methodNames.forEach(function(meth) {
		if (!handler[meth])
			handler[meth] = forward;
	});
}

var abstractPipeline = {
	addFirst: function(name, handler) {
		coerce(this._pipedMethodNames, handler);
		this._handlers.unshift({name: name, handler: handler});
	},

	addLast: function(name, handler) {
		coerce(this._pipedMethodNames, handler);
		this._handlers.push({name: name, handler: handler});
	},

 	/**
 	Add the handler with the given name after the 
 	handler specified by target.  Target can be a handler
 	name or a handler instance.
 	*/
	addAfter: function(target, name, handler) {
		coerce(this._pipedMethodNames, handler);
		var handlers = this._handlers;
		var len = handlers.length;
		var i = indexOfHandler(handlers, len, target);

		if (i >= 0) {
			handlers.splice(i+1, 0, {name: name, handler: handler});
		}
	},

	/**
	Add the handler with the given name after the handler
	specified by target.  Target can be a handler name or
	a handler instance.
	*/
	addBefore: function(target, name, handler) {
		coerce(this._pipedMethodNames, handler);
		var handlers = this._handlers;
		var len = handlers.length;
		var i = indexOfHandler(handlers, len, target);

		if (i >= 0) {
			handlers.splice(i, 0, {name: name, handler: handler});
		}
	},

	/**
	Replace the handler specified by target.
	*/
	replace: function(target, newName, handler) {
		coerce(this._pipedMethodNames, handler);
		var handlers = this._handlers;
		var len = handlers.length;
		var i = indexOfHandler(handlers, len, target);

		if (i >= 0) {
			handlers.splice(i, 1, {name: newName, handler: handler});
		}
	},

	removeFirst: function() {
		return this._handlers.shift();
	},

	removeLast: function() {
		return this._handlers.pop();
	},

	remove: function(target) {
		var handlers = this._handlers;
		var len = handlers.length;
		var i = indexOfHandler(handlers, len, target);

		if (i >= 0)
			handlers.splice(i, 1);
	},

	getHandler: function(name) {
		var i = indexOfHandler(this._handlers, this._handlers.length, name);
		if (i >= 0)
			return this._handlers[i].handler;
		return null;
	}
};

function createPipeline(pipedMethodNames) {
	var end = {};
	var endStubFunc = function() { return end; };
	var nextMethods = {};

	function Pipeline(pipedMethodNames) {
		this.pipe = {
			_handlers: [],
			_contextCtor: PipeContext,
			_nextMethods: nextMethods,
			end: end,
			_pipedMethodNames: pipedMethodNames
		};
	}

	var pipeline = new Pipeline(pipedMethodNames);
	for (var k in abstractPipeline) {
		pipeline.pipe[k] = abstractPipeline[k];
	}

	pipedMethodNames.forEach(function(name) {
		end[name] = endStubFunc;

		nextMethods[name] = new Function(
			"var handler = this._nextHandler();" +
			"handler.__pipectx = this.__pipectx;" +
			"return handler." + name + ".apply(handler, arguments);");

		pipeline[name] = new Function(
			"var ctx = new this.pipe._contextCtor(this.pipe._handlers, this.pipe._nextMethods." + name + ", this.pipe.end);"
			+ "return ctx.next.apply(ctx, arguments);");
	});

	return pipeline;
}

createPipeline.isPipeline = function(obj) {
	return obj instanceof Pipeline;
}
var utils = (function() {
	return {
		convertToBase64: function(blob, cb) {
			var fr = new FileReader();
			fr.onload = function(e) {
				cb(e.target.result);
			};
			fr.onerror = function(e) {
			};
			fr.onabort = function(e) {
			};
			fr.readAsDataURL(blob);
		},

		dataURLToBlob: function(dataURL) {
				var BASE64_MARKER = ';base64,';
				if (dataURL.indexOf(BASE64_MARKER) == -1) {
					var parts = dataURL.split(',');
					var contentType = parts[0].split(':')[1];
					var raw = parts[1];

					return new Blob([raw], {type: contentType});
				}

				var parts = dataURL.split(BASE64_MARKER);
				var contentType = parts[0].split(':')[1];
				var raw = window.atob(parts[1]);
				var rawLength = raw.length;

				var uInt8Array = new Uint8Array(rawLength);

				for (var i = 0; i < rawLength; ++i) {
					uInt8Array[i] = raw.charCodeAt(i);
				}

				return new Blob([uInt8Array.buffer], {type: contentType});
		},

		splitAttachmentPath: function(path) {
			var parts = path.split('/');
			if (parts.length == 1) 
				parts.unshift('__nodoc__');
			return parts;
		},

		mapAsync: function(fn, promise) {
			var deferred = Q.defer();
			promise.then(function(data) {
				_mapAsync(fn, data, [], deferred);
			}, function(e) {
				deferred.reject(e);
			});

			return deferred.promise;
		},

		countdown: function(n, cb) {
		    var args = [];
		    return function() {
		      for (var i = 0; i < arguments.length; ++i)
		        args.push(arguments[i]);
		      n -= 1;
		      if (n == 0)
		        cb.apply(this, args);
		    }
		}
	};

	function _mapAsync(fn, data, result, deferred) {
		fn(data[result.length], function(v) {
			result.push(v);
			if (result.length == data.length)
				deferred.resolve(result);
			else
				_mapAsync(fn, data, result, deferred);
		}, function(err) {
			deferred.reject(err);
		})
	}
})();
var FilesystemAPIProvider = (function(Q) {
	function makeErrorHandler(deferred, finalDeferred) {
		// TODO: normalize the error so
		// we can handle it upstream
		return function(e) {
			if (e.code == 1) {
				deferred.resolve(undefined);
			} else {
				if (finalDeferred)
					finalDeferred.reject(e);
				else
					deferred.reject(e);
			}
		}
	}

	function getAttachmentPath(docKey, attachKey) {
		docKey = docKey.replace(/\//g, '--');
		var attachmentsDir = docKey + "-attachments";
		return {
			dir: attachmentsDir,
			path: attachmentsDir + "/" + attachKey
		};
	}

	function readDirEntries(reader, result) {
		var deferred = Q.defer();

		_readDirEntries(reader, result, deferred);

		return deferred.promise;
	}

	function _readDirEntries(reader, result, deferred) {
		reader.readEntries(function(entries) {
			if (entries.length == 0) {
				deferred.resolve(result);
			} else {
				result = result.concat(entries);
				_readDirEntries(reader, result, deferred);
			}
		}, function(err) {
			deferred.reject(err);
		});
	}

	function entryToFile(entry, cb, eb) {
		entry.file(cb, eb);
	}

	function entryToURL(entry) {
		return entry.toURL();
	}

	function FSAPI(fs, numBytes, prefix) {
		this._fs = fs;
		this._capacity = numBytes;
		this._prefix = prefix;
		this.type = "FilesystemAPI";
	}

	FSAPI.prototype = {
		getContents: function(path, options) {
			var deferred = Q.defer();
			path = this._prefix + path;
			this._fs.root.getFile(path, {}, function(fileEntry) {
				fileEntry.file(function(file) {
					var reader = new FileReader();

					reader.onloadend = function(e) {
						var data = e.target.result;
						var err;
						if (options && options.json) {
							try {
								data = JSON.parse(data);
							} catch(e) {
								err = new Error('unable to parse JSON for ' + path);
							}
						}

						if (err) {
							deferred.reject(err);
						} else {
							deferred.resolve(data);
						}
					};

					reader.readAsText(file);
				}, makeErrorHandler(deferred));
			}, makeErrorHandler(deferred));

			return deferred.promise;
		},

		// create a file at path
		// and write `data` to it
		setContents: function(path, data, options) {
			var deferred = Q.defer();

			if (options && options.json)
				data = JSON.stringify(data);

			path = this._prefix + path;
			this._fs.root.getFile(path, {create:true}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					var blob;
					fileWriter.onwriteend = function(e) {
						fileWriter.onwriteend = function() {
							deferred.resolve();
						};
						fileWriter.truncate(blob.size);
					}

					fileWriter.onerror = makeErrorHandler(deferred);

					if (data instanceof Blob) {
						blob = data;
					} else {
						blob = new Blob([data], {type: 'text/plain'});
					}

					fileWriter.write(blob);
				}, makeErrorHandler(deferred));
			}, makeErrorHandler(deferred));

			return deferred.promise;
		},

		ls: function(docKey) {
			var isRoot = false;
			if (!docKey) {docKey = this._prefix; isRoot = true;}
			else docKey = this._prefix + docKey + "-attachments";

			var deferred = Q.defer();

			this._fs.root.getDirectory(docKey, {create:false},
			function(entry) {
				var reader = entry.createReader();
				readDirEntries(reader, []).then(function(entries) {
					var listing = [];
					entries.forEach(function(entry) {
						if (!entry.isDirectory) {
							listing.push(entry.name);
						}
					});
					deferred.resolve(listing);
				});
			}, function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

		clear: function() {
			var deferred = Q.defer();
			var failed = false;
			var ecb = function(err) {
				failed = true;
				deferred.reject(err);
			}

			this._fs.root.getDirectory(this._prefix, {},
			function(entry) {
				var reader = entry.createReader();
				reader.readEntries(function(entries) {
					var latch = 
					utils.countdown(entries.length, function() {
						if (!failed)
							deferred.resolve();
					});

					entries.forEach(function(entry) {
						if (entry.isDirectory) {
							entry.removeRecursively(latch, ecb);
						} else {
							entry.remove(latch, ecb);
						}
					});

					if (entries.length == 0)
						deferred.resolve();
				}, ecb);
			}, ecb);

			return deferred.promise;
		},

		rm: function(path) {
			var deferred = Q.defer();
			var finalDeferred = Q.defer();

			// remove attachments that go along with the path
			path = this._prefix + path;
			var attachmentsDir = path + "-attachments";

			this._fs.root.getFile(path, {create:false},
				function(entry) {
					entry.remove(function() {
						deferred.promise.then(finalDeferred.resolve);
					}, function(err) {
						finalDeferred.reject(err);
					});
				},
				makeErrorHandler(finalDeferred));

			this._fs.root.getDirectory(attachmentsDir, {},
				function(entry) {
					entry.removeRecursively(function() {
						deferred.resolve();
					}, function(err) {
						finalDeferred.reject(err);
					});
				},
				makeErrorHandler(deferred, finalDeferred));

			return finalDeferred.promise;
		},

		getAttachment: function(docKey, attachKey) {
			var attachmentPath = this._prefix + getAttachmentPath(docKey, attachKey).path;

			var deferred = Q.defer();
			this._fs.root.getFile(attachmentPath, {}, function(fileEntry) {
				fileEntry.file(function(file) {
					if (file.size == 0)
						deferred.resolve(undefined);
					else
						deferred.resolve(file);
				}, makeErrorHandler(deferred));
			}, function(err) {
				if (err.code == 1) {
					deferred.resolve(undefined);
				} else {
					deferred.reject(err);
				}
			});

			return deferred.promise;
		},

		getAttachmentURL: function(docKey, attachKey) {
			var attachmentPath = this._prefix + getAttachmentPath(docKey, attachKey).path;

			var deferred = Q.defer();
			var url = 'filesystem:' + window.location.protocol + '//' + window.location.host + '/persistent/' + attachmentPath;
			deferred.resolve(url);
			// this._fs.root.getFile(attachmentPath, {}, function(fileEntry) {
			// 	deferred.resolve(fileEntry.toURL());
			// }, makeErrorHandler(deferred, "getting attachment file entry"));

			return deferred.promise;
		},

		getAllAttachments: function(docKey) {
			var deferred = Q.defer();
			var attachmentsDir = this._prefix + docKey + "-attachments";

			this._fs.root.getDirectory(attachmentsDir, {},
			function(entry) {
				var reader = entry.createReader();
				deferred.resolve(
					utils.mapAsync(function(entry, cb, eb) {
						entry.file(function(file) {
							cb({
								data: file,
								docKey: docKey,
								attachKey: entry.name
							});
						}, eb);
					}, readDirEntries(reader, [])));
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		},

		getAllAttachmentURLs: function(docKey) {
			var deferred = Q.defer();
			var attachmentsDir = this._prefix + docKey + "-attachments";

			this._fs.root.getDirectory(attachmentsDir, {},
			function(entry) {
				var reader = entry.createReader();
				readDirEntries(reader, []).then(function(entries) {
					deferred.resolve(entries.map(
					function(entry) {
						return {
							url: entry.toURL(),
							docKey: docKey,
							attachKey: entry.name
						};
					}));
				});
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		},

		revokeAttachmentURL: function(url) {
			// we return FS urls so this is a no-op
			// unless someone is being silly and doing
			// createObjectURL(getAttachment()) ......
		},

		// Create a folder at dirname(path)+"-attachments"
		// add attachment under that folder as basename(path)
		setAttachment: function(docKey, attachKey, data) {
			var attachInfo = getAttachmentPath(docKey, attachKey);

			var deferred = Q.defer();

			var self = this;
			this._fs.root.getDirectory(this._prefix + attachInfo.dir,
			{create:true}, function(dirEntry) {
				deferred.resolve(self.setContents(attachInfo.path, data));
			}, makeErrorHandler(deferred));

			return deferred.promise;
		},

		// rm the thing at dirname(path)+"-attachments/"+basename(path)
		rmAttachment: function(docKey, attachKey) {
			var attachmentPath = getAttachmentPath(docKey, attachKey).path;

			var deferred = Q.defer();
			this._fs.root.getFile(this._prefix + attachmentPath, {create:false},
				function(entry) {
					entry.remove(function() {
						deferred.resolve();
					}, makeErrorHandler(deferred));
			}, makeErrorHandler(deferred));

			return deferred.promise;
		},

		getCapacity: function() {
			return this._capacity;
		}
	};

	return {
		init: function(config) {
			var deferred = Q.defer();
			window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
			var persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;

			if (!requestFileSystem) {
				deferred.reject("No FS API");
				return deferred.promise;
			}

			var prefix = config.name + '/';

			persistentStorage.requestQuota(config.size,
			function(numBytes) {
				requestFileSystem(window.PERSISTENT, numBytes,
				function(fs) {
					fs.root.getDirectory(config.name, {create: true},
					function() {
						deferred.resolve(new FSAPI(fs, numBytes, prefix));
					}, function(err) {
						console.error(err);
						deferred.reject(err);
					});
				}, function(err) {
					// TODO: implement various error messages.
					console.error(err);
					deferred.reject(err);
				});
			}, function(err) {
				// TODO: implement various error messages.
				console.error(err);
				deferred.reject(err);
			});

			return deferred.promise;
		}
	}
})(Q);
var IndexedDBProvider = (function(Q) {
	var URL = window.URL || window.webkitURL;

	var convertToBase64 = utils.convertToBase64;
	var dataURLToBlob = utils.dataURLToBlob;

	function IDB(db) {
		this._db = db;
		this.type = 'IndexedDB';

		var transaction = this._db.transaction(['attachments'], 'readwrite');
		this._supportsBlobs = true;
		try {
			transaction.objectStore('attachments')
			.put(Blob(["sdf"], {type: "text/plain"}), "featurecheck");
		} catch (e) {
			this._supportsBlobs = false;
		}
	}

	// TODO: normalize returns and errors.
	IDB.prototype = {
		getContents: function(docKey) {
			var deferred = Q.defer();
			var transaction = this._db.transaction(['files'], 'readonly');

			var get = transaction.objectStore('files').get(docKey);
			get.onsuccess = function(e) {
				deferred.resolve(e.target.result);
			};

			get.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		},

		setContents: function(docKey, data) {
			var deferred = Q.defer();
			var transaction = this._db.transaction(['files'], 'readwrite');

			var put = transaction.objectStore('files').put(data, docKey);
			put.onsuccess = function(e) {
				deferred.resolve(e);
			};

			put.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		},

		rm: function(docKey) {
			var deferred = Q.defer();
			var finalDeferred = Q.defer();

			var transaction = this._db.transaction(['files', 'attachments'], 'readwrite');
			
			var del = transaction.objectStore('files').delete(docKey);

			del.onsuccess = function(e) {
				deferred.promise.then(function() {
					finalDeferred.resolve();
				});
			};

			del.onerror = function(e) {
				deferred.promise.catch(function() {
					finalDeferred.reject(e);
				});
			};

			var attachmentsStore = transaction.objectStore('attachments');
			var index = attachmentsStore.index('fname');
			var cursor = index.openCursor(IDBKeyRange.only(docKey));
			cursor.onsuccess = function(e) {
				var cursor = e.target.result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				} else {
					deferred.resolve();
				}
			};

			cursor.onerror = function(e) {
				deferred.reject(e);
			}

			return finalDeferred.promise;
		},

		getAttachment: function(docKey, attachKey) {
			var deferred = Q.defer();

			var transaction = this._db.transaction(['attachments'], 'readonly');
			var get = transaction.objectStore('attachments').get(docKey + '/' + attachKey);

			var self = this;
			get.onsuccess = function(e) {
				if (!e.target.result) {
					deferred.resolve(undefined);
					return;
				}

				var data = e.target.result.data;
				if (!self._supportsBlobs) {
					data = dataURLToBlob(data);
				}
				deferred.resolve(data);
			};

			get.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		},

		ls: function(docKey) {
			var deferred = Q.defer();

			if (!docKey) {
				// list docs
				var store = 'files';
			} else {
				// list attachments
				var store = 'attachments';
			}

			var transaction = this._db.transaction([store], 'readonly');
			var cursor = transaction.objectStore(store).openCursor();
			var listing = [];

			cursor.onsuccess = function(e) {
				var cursor = e.target.result;
				if (cursor) {
					listing.push(!docKey ? cursor.key : cursor.key.split('/')[1]);
					cursor.continue();
				} else {
					deferred.resolve(listing);
				}
			};

			cursor.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		},

		clear: function() {
			var deferred = Q.defer();
			var finalDeferred = Q.defer();

			var t = this._db.transaction(['attachments', 'files'], 'readwrite');


			var req1 = t.objectStore('attachments').clear();
			var req2 = t.objectStore('files').clear();

			req1.onsuccess = function() {
				deferred.promise.then(finalDeferred.resolve);
			};

			req2.onsuccess = function() {
				deferred.resolve();
			};

			req1.onerror = function(err) {
				finalDeferred.reject(err);
			};

			req2.onerror = function(err) {
				finalDeferred.reject(err);
			};

			return finalDeferred.promise;
		},

		getAllAttachments: function(docKey) {
			var deferred = Q.defer();
			var self = this;

			var transaction = this._db.transaction(['attachments'], 'readonly');
			var index = transaction.objectStore('attachments').index('fname');

			var cursor = index.openCursor(IDBKeyRange.only(docKey));
			var values = [];
			cursor.onsuccess = function(e) {
				var cursor = e.target.result;
				if (cursor) {
					var data;
					if (!self._supportsBlobs) {
						data = dataURLToBlob(cursor.value.data)
					} else {
						data = cursor.value.data;
					}
					values.push({
						data: data,
						docKey: docKey,
						attachKey: cursor.primaryKey.split('/')[1] // TODO
					});
					cursor.continue();
				} else {
					deferred.resolve(values);
				}
			};

			cursor.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		},

		getAllAttachmentURLs: function(docKey) {
			var deferred = Q.defer();
			this.getAllAttachments(docKey).then(function(attachments) {
				var urls = attachments.map(function(a) {
					a.url = URL.createObjectURL(a.data);
					delete a.data;
					return a;
				});

				deferred.resolve(urls);
			}, function(e) {
				deferred.reject(e);
			});

			return deferred.promise;
		},

		getAttachmentURL: function(docKey, attachKey) {
			var deferred = Q.defer();
			this.getAttachment(docKey, attachKey).then(function(attachment) {
				deferred.resolve(URL.createObjectURL(attachment));
			}, function(e) {
				deferred.reject(e);
			});

			return deferred.promise;
		},

		revokeAttachmentURL: function(url) {
			URL.revokeObjectURL(url);
		},

		setAttachment: function(docKey, attachKey, data) {
			var deferred = Q.defer();

			if (data instanceof Blob && !this._supportsBlobs) {
				var self = this;
				convertToBase64(data, function(data) {
					continuation.call(self, data);
				});
			} else {
				continuation.call(this, data);
			}

			function continuation(data) {
				var obj = {
					path: docKey + '/' + attachKey,
					fname: docKey,
					data: data
				};
				var transaction = this._db.transaction(['attachments'], 'readwrite');
				var put = transaction.objectStore('attachments').put(obj);

				put.onsuccess = function(e) {
					deferred.resolve(e);
				};

				put.onerror = function(e) {
					deferred.reject(e);
				};
			}

			return deferred.promise;
		},

		rmAttachment: function(docKey, attachKey) {
			var deferred = Q.defer();
			var transaction = this._db.transaction(['attachments'], 'readwrite');
			var del = transaction.objectStore('attachments').delete(docKey + '/' + attachKey);

			del.onsuccess = function(e) {
				deferred.resolve(e);
			};

			del.onerror = function(e) {
				deferred.reject(e);
			};

			return deferred.promise;
		}
	};

	return {
		init: function(config) {
			var deferred = Q.defer();

			var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
			IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
			dbVersion = 2;

			if (!indexedDB || !IDBTransaction) {
				deferred.reject("No IndexedDB");
				return deferred.promise;
			}

			var request = indexedDB.open(config.name, dbVersion);

			function createObjectStore(db) {
				db.createObjectStore("files");
				var attachStore = db.createObjectStore("attachments", {keyPath: 'path'});
				attachStore.createIndex('fname', 'fname', {unique: false})
			}

			// TODO: normalize errors
			request.onerror = function (event) {
				deferred.reject(event);
			};
		 
			request.onsuccess = function (event) {
				var db = request.result;
		 
				db.onerror = function (event) {
					console.log(event);
				};
				
				// Chrome workaround
				if (db.setVersion) {
					if (db.version != dbVersion) {
						var setVersion = db.setVersion(dbVersion);
						setVersion.onsuccess = function () {
							createObjectStore(db);
							deferred.resolve();
						};
					}
					else {
						deferred.resolve(new IDB(db));
					}
				} else {
					deferred.resolve(new IDB(db));
				}
			}
			
			request.onupgradeneeded = function (event) {
				createObjectStore(event.target.result);
			};

			return deferred.promise;
		}
	}
})(Q);
var LocalStorageProvider = (function(Q) {
	return {
		init: function() {
			return Q({type: 'LocalStorage'});
		}
	}
})(Q);
var WebSQLProvider = (function(Q) {
	var URL = window.URL || window.webkitURL;
	var convertToBase64 = utils.convertToBase64;
	var dataURLToBlob = utils.dataURLToBlob;

	function WSQL(db) {
		this._db = db;
		this.type = 'WebSQL';
	}

	WSQL.prototype = {
		getContents: function(docKey, options) {
			var deferred = Q.defer();
			this._db.transaction(function(tx) {
				tx.executeSql('SELECT value FROM files WHERE fname = ?', [docKey],
				function(tx, res) {
					if (res.rows.length == 0) {
						deferred.resolve(undefined);
					} else {
						var data = res.rows.item(0).value;
						if (options && options.json)
							data = JSON.parse(data);
						deferred.resolve(data);
					}
				});
			}, function(err) {
				consol.log(err);
				deferred.reject(err);
			});

			return deferred.promise;
		},

		setContents: function(docKey, data, options) {
			var deferred = Q.defer();
			if (options && options.json)
				data = JSON.stringify(data);

			this._db.transaction(function(tx) {
				tx.executeSql(
				'INSERT OR REPLACE INTO files (fname, value) VALUES(?, ?)', [docKey, data]);
			}, function(err) {
				console.log(err);
				deferred.reject(err);
			}, function() {
				deferred.resolve();
			});

			return deferred.promise;
		},

		rm: function(docKey) {
			var deferred = Q.defer();

			this._db.transaction(function(tx) {
				tx.executeSql('DELETE FROM files WHERE fname = ?', [docKey]);
				tx.executeSql('DELETE FROM attachments WHERE fname = ?', [docKey]);
			}, function(err) {
				console.log(err);
				deferred.reject(err);
			}, function() {
				deferred.resolve();
			});

			return deferred.promise;
		},

		getAttachment: function(fname, akey) {
			var deferred = Q.defer();

			this._db.transaction(function(tx){ 
				tx.executeSql('SELECT value FROM attachments WHERE fname = ? AND akey = ?',
				[fname, akey],
				function(tx, res) {
					if (res.rows.length == 0) {
						deferred.resolve(undefined);
					} else {
						deferred.resolve(dataURLToBlob(res.rows.item(0).value));
					}
				});
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		},

		getAttachmentURL: function(docKey, attachKey) {
			var deferred = Q.defer();
			this.getAttachment(docKey, attachKey).then(function(blob) {
				deferred.resolve(URL.createObjectURL(blob));
			}, function() {
				deferred.reject();
			});

			return deferred.promise;
		},

		ls: function(docKey) {
			var deferred = Q.defer();

			var select;
			var field;
			if (!docKey) {
				select = 'SELECT fname FROM files';
				field = 'fname';
			} else {
				select = 'SELECT akey FROM attachments WHERE fname = ?';
				field = 'akey';
			}

			this._db.transaction(function(tx) {
				tx.executeSql(select, docKey ? [docKey] : [],
				function(tx, res) {
					var listing = [];
					for (var i = 0; i < res.rows.length; ++i) {
						listing.push(res.rows.item(i)[field]);
					}

					deferred.resolve(listing);
				}, function(err) {
					deferred.reject(err);
				});
			});

			return deferred.promise;
		},

		clear: function() {
			var deffered1 = Q.defer();
			var deffered2 = Q.defer();

			this._db.transaction(function(tx) {
				tx.executeSql('DELETE FROM files', function() {
					deffered1.resolve();
				});
				tx.executeSql('DELETE FROM attachments', function() {
					deffered2.resolve();
				});
			}, function(err) {
				deffered1.reject(err);
				deffered2.reject(err);
			});

			return Q.all([deffered1, deffered2]);
		},

		getAllAttachments: function(fname) {
			var deferred = Q.defer();

			this._db.transaction(function(tx) {
				tx.executeSql('SELECT value, akey FROM attachments WHERE fname = ?',
				[fname],
				function(tx, res) {
					// TODO: ship this work off to a webworker
					// since there could be many of these conversions?
					var result = [];
					for (var i = 0; i < res.rows.length; ++i) {
						var item = res.rows.item(i);
						result.push({
							docKey: fname,
							attachKey: item.akey,
							data: dataURLToBlob(item.value)
						});
					}

					deferred.resolve(result);
				});
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		},

		getAllAttachmentURLs: function(fname) {
			var deferred = Q.defer();
			this.getAllAttachments(fname).then(function(attachments) {
				var urls = attachments.map(function(a) {
					a.url = URL.createObjectURL(a.data);
					delete a.data;
					return a;
				});

				deferred.resolve(urls);
			}, function(e) {
				deferred.reject(e);
			});

			return deferred.promise;
		},

		revokeAttachmentURL: function(url) {
			URL.revokeObjectURL(url);
		},

		setAttachment: function(fname, akey, data) {
			var deferred = Q.defer();

			var self = this;
			convertToBase64(data, function(data) {
				self._db.transaction(function(tx) {
					tx.executeSql(
					'INSERT OR REPLACE INTO attachments (fname, akey, value) VALUES(?, ?, ?)',
					[fname, akey, data]);
				}, function(err) {
					deferred.reject(err);
				}, function() {
					deferred.resolve();
				});
			});

			return deferred.promise;
		},

		rmAttachment: function(fname, akey) {
			var deferred = Q.defer();
			this._db.transaction(function(tx) {
				tx.executeSql('DELETE FROM attachments WHERE fname = ? AND akey = ?',
				[fname, akey]);
			}, function(err) {
				deferred.reject(err);
			}, function() {
				deferred.resolve();
			});

			return deferred.promise;
		}
	};

	return {
		init: function(config) {
			var openDb = window.openDatabase;
			var deferred = Q.defer();
			if (!openDb) {
				deferred.reject("No WebSQL");
				return deferred.promise;
			}

			var db = openDb(config.name, '1.0', 'large local storage', config.size);

			db.transaction(function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS files (fname unique, value)');
				tx.executeSql('CREATE TABLE IF NOT EXISTS attachments (fname, akey, value)');
				tx.executeSql('CREATE INDEX IF NOT EXISTS fname_index ON attachments (fname)');
				tx.executeSql('CREATE INDEX IF NOT EXISTS akey_index ON attachments (akey)');
				tx.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_attach ON attachments (fname, akey)')
			}, function(err) {
				deferred.reject(err);
			}, function() {
				deferred.resolve(new WSQL(db));
			});

			return deferred.promise;
		}
	}
})(Q);
var LargeLocalStorage = (function(Q) {
	var sessionMeta = localStorage.getItem('LargeLocalStorage-meta');
	if (sessionMeta)
		sessionMeta = JSON.parse(sessionMeta);
	else
		sessionMeta = {};

	function defaults(options, defaultOptions) {
		for (var k in defaultOptions) {
			if (options[k] === undefined)
				options[k] = defaultOptions[k];
		}

		return options;
	}

	function getImpl(type) {
		switch(type) {
			case 'FileSystemAPI':
				return FilesystemAPIProvider.init();
			case 'IndexedDB':
				return IndexedDBProvider.init();
			case 'WebSQL':
				return WebSQLProvider.init();
			case 'LocalStorage':
				return LocalStorageProvider.init();
		}
	}

	var providers = {
		FileSystemAPI: FilesystemAPIProvider,
		IndexedDB: IndexedDBProvider,
		WebSQL: WebSQLProvider,
		LocalStorage: LocalStorageProvider
	}

	var defaultConfig = {
		size: 10 * 1024 * 1024,
		name: 'lls'
	};

	function selectImplementation(config) {
		if (!config) config = {};
		config = defaults(config, defaultConfig);

		if (config.forceProvider) {
			return providers[config.forceProvider].init(config);
		}

		return FilesystemAPIProvider.init(config).then(function(impl) {
			return Q(impl);
		}, function() {
			return IndexedDBProvider.init(config);
		}).then(function(impl) {
			return Q(impl);
		}, function() {
			return WebSQLProvider.init(config);
		}).then(function(impl) {
			return Q(impl);
		}, function() {
			console.error('Unable to create any storage implementations.  Using LocalStorage');
			return LocalStorageProvider.init(config);
		});
	}

	function copyOldData(from, to) {
		// from = getImpl(from);
		console.log('Underlying implementation change.');
	}

	/**
	 * 
	 * LargeLocalStorage (or LLS) gives you a large capacity 
	 * (up to several gig with permission from the user)
	 * key-value store in the browser.
	 *
	 * For storage, LLS uses the [FilesystemAPI](https://developer.mozilla.org/en-US/docs/WebGuide/API/File_System)
	 * when running in Crome and Opera, 
	 * [InexedDB](https://developer.mozilla.org/en-US/docs/IndexedDB) in Firefox and IE
	 * and [WebSQL](http://www.w3.org/TR/webdatabase/) in Safari.
	 *
	 * When IndexedDB becomes available in Safari, LLS will
	 * update to take advantage of that storage implementation.
	 *
	 *
	 * Upon construction a LargeLocalStorage (LLS) object will be 
	 * immediately returned but not necessarily immediately ready for use.
	 *
	 * A LLS object has an `initialized` property which is a promise
	 * that is resolved when the LLS object is ready for us.
	 *
	 * Usage of LLS would typically be:
	 * ```
	 * var storage = new LargeLocalStorage({size: 75*1024*1024});
	 * storage.initialized.then(function(grantedCapacity) {
	 *   // storage ready to be used.
	 * });
	 * ```
	 *
	 * The reason that LLS may not be immediately ready for
	 * use is that some browsers require confirmation from the
	 * user before a storage area may be created.  Also,
	 * the browser's native storage APIs are asynchronous.
	 *
	 * If an LLS instance is used before the storage
	 * area is ready then any
	 * calls to it will throw an exception with code: "NO_IMPLEMENTATION"
	 *
	 * This behavior is useful when you want the application
	 * to continue to function--regardless of whether or
	 * not the user has allowed it to store data--and would
	 * like to know when your storage calls fail at the point
	 * of those calls.
	 *
	 * LLS-contrib has utilities to queue storage calls until
	 * the implementation is ready.  If an implementation
	 * is never ready this could obviously lead to memory issues
	 * which is why it is not the default behavior.
	 *
	 * @example
	 *	var desiredCapacity = 50 * 1024 * 1024; // 50MB
	 *	var storage = new LargeLocalStorage({
	 *		// desired capacity, in bytes.
	 *		size: desiredCapacity,
	 *
	 * 		// optional name for your LLS database. Defaults to lls.
	 *		// This is the name given to the underlying
	 *		// IndexedDB or WebSQL DB or FSAPI Folder.
	 *		// LLS's with different names are independent.
	 *		name: 'myStorage'
	 *
	 *		// the following is an optional param 
	 *		// that is useful for debugging.
	 *		// force LLS to use a specific storage implementation
	 *		// forceProvider: 'IndexedDB' or 'WebSQL' or 'FilesystemAPI'
	 *	});
	 *	storage.initialized.then(function(capacity) {
	 *		if (capacity != -1 && capacity != desiredCapacity) {
	 *			// the user didn't authorize your storage request
	 *			// so instead you have some limitation on your storage
	 *		}
	 *	})
	 *
	 * @class LargeLocalStorage
	 * @constructor
	 * @param {object} config {size: sizeInByes, [forceProvider: force a specific implementation]}
	 * @return {LargeLocalStorage}
	 */
	function LargeLocalStorage(config) {
		var self = this;
		var deferred = Q.defer();
		selectImplementation(config).then(function(impl) {
			console.log('Selected: ' + impl.type);
			self._impl = impl;
			if (sessionMeta.lastStorageImpl != self._impl.type) {
				copyOldData(sessionMeta.lastStorageImpl, self._impl);
			}
			sessionMeta.lastStorageImpl = impl.type;
			deferred.resolve(self);
		}).catch(function(e) {
			// This should be impossible
			console.log(e);
			deferred.reject('No storage provider found');
		});

		/**
		* @property {promise} initialized
		*/
		this.initialized = deferred.promise;

		var piped = createPipeline([
			'ready',
			'ls',
			'rm',
			'clear',
			'getContents',
			'setContents',
			'getAttachment',
			'setAttachment',
			'getAttachmentURL',
			'getAllAttachments',
			'getAllAttachmentURLs',
			'revokeAttachmentURL',
			'rmAttachment',
			'getCapacity',
			'initialized']);

		piped.pipe.addLast('lls', this);
		piped.initialized = this.initialized;
		return piped;
	}

	LargeLocalStorage.prototype = {
		/**
		* Whether or not LLS is ready to store data.
		* The `initialized` property can be used to
		* await initialization.
		* @example
		*	// may or may not be true
		*	storage.ready();
		*	
		*	storage.initialized.then(function() {
		*		// always true
		*		storage.ready();
		*	})
		* @method ready
		*/
		ready: function() {
			return this._impl != null;
		},

		/**
		* List all attachments under a given key.
		*
		* List all documents if no key is provided.
		*
		* Returns a promise that is fulfilled with
		* the listing.
		*
		* @example
		*	storage.ls().then(function(docKeys) {
		*		console.log(docKeys);
		*	})
		*
		* @method ls
		* @param {string} [docKey]
		* @returns {promise} resolved with the listing, rejected if the listing fails.
		*/
		ls: function(docKey) {
			this._checkAvailability();
			return this._impl.ls(docKey);
		},

		/**
		* Remove the specified document and all
		* of its attachments.
		*
		* Returns a promise that is fulfilled when the
		* removal completes.
		*
		* If no docKey is specified, this throws an error.
		*
		* To remove all files in LargeLocalStorage call
		* `lls.clear();`
		*
		* To remove all attachments that were written without
		* a docKey, call `lls.rm('__emptydoc__');`
		*
		* rm works this way to ensure you don't lose
		* data due to an accidently undefined variable.
		*
		* @example
		* 	stoarge.rm('exampleDoc').then(function() {
		*		alert('doc and all attachments were removed');
		* 	})
		*
		* @method rm
		* @param {string} docKey
		* @returns {promise} resolved when removal completes, rejected if the removal fails.
		*/
		rm: function(docKey) {
			this._checkAvailability();
			return this._impl.rm(docKey);
		},

		/**
		* An explicit way to remove all documents and
		* attachments from LargeLocalStorage.
		*
		* @example
		*	storage.clear().then(function() {
		*		alert('all data has been removed');
		*	});
		* 
		* @returns {promise} resolve when clear completes, rejected if clear fails.
		*/
		clear: function() {
			this._checkAvailability();
			return this._impl.clear();
		},

		/**
		* Get the contents of a document identified by `docKey`
		* TODO: normalize all implementations to allow storage
		* and retrieval of JS objects?
		*
		* @example
		* 	storage.getContents('exampleDoc').then(function(contents) {
		* 		alert(contents);
		* 	});
		*
		* @method getContents
		* @param {string} docKey
		* @returns {promise} resolved with the contents when the get completes
		*/
		getContents: function(docKey, options) {
			this._checkAvailability();
			return this._impl.getContents(docKey, options);
		},

		/**
		* Set the contents identified by `docKey` to `data`.
		* The document will be created if it does not exist.
		*
		* @example
		* 	storage.setContents('exampleDoc', 'some data...').then(function() {
		*		alert('doc written');
		* 	});
		*
		* @method setContents
		* @param {string} docKey
		* @param {any} data
		* @returns {promise} fulfilled when set completes
		*/
		setContents: function(docKey, data, options) {
			this._checkAvailability();
			return this._impl.setContents(docKey, data, options);
		},

		/**
		* Get the attachment identified by `docKey` and `attachKey`
		*
		* @example
		* 	storage.getAttachment('exampleDoc', 'examplePic').then(function(attachment) {
		*    	var url = URL.createObjectURL(attachment);
		*    	var image = new Image(url);
		*    	document.body.appendChild(image);
		*    	URL.revokeObjectURL(url);
		* 	})
		*
		* @method getAttachment
		* @param {string} [docKey] Defaults to `__emptydoc__`
		* @param {string} attachKey key of the attachment
		* @returns {promise} fulfilled with the attachment or
		* rejected if it could not be found.  code: 1
		*/
		getAttachment: function(docKey, attachKey) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.getAttachment(docKey, attachKey);
		},

		/**
		* Set an attachment for a given document.  Identified
		* by `docKey` and `attachKey`.
		*
		* @example
		* 	storage.setAttachment('myDoc', 'myPic', blob).then(function() {
		*    	alert('Attachment written');
		* 	})
		*
		* @method setAttachment
		* @param {string} [docKey] Defaults to `__emptydoc__`
		* @param {string} attachKey key for the attachment
		* @param {any} attachment data
		* @returns {promise} resolved when the write completes.  Rejected
		* if an error occurs.
		*/
		setAttachment: function(docKey, attachKey, data) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.setAttachment(docKey, attachKey, data);
		},

		/**
		* Get the URL for a given attachment.
		*
		* @example
		* 	storage.getAttachmentURL('myDoc', 'myPic').then(function(url) {
	 	*   	var image = new Image();
	 	*   	image.src = url;
	 	*   	document.body.appendChild(image);
	 	*   	storage.revokeAttachmentURL(url);
		* 	})
		*
		* This is preferrable to getting the attachment and then getting the
		* URL via `createObjectURL` (on some systems) as LLS can take advantage of 
		* lower level details to improve performance.
		*
		* @method getAttachmentURL
		* @param {string} [docKey] Identifies the document.  Defaults to `__emptydoc__`
		* @param {string} attachKey Identifies the attachment.
		* @returns {promose} promise that is resolved with the attachment url.
		*/
		getAttachmentURL: function(docKey, attachKey) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.getAttachmentURL(docKey, attachKey);
		},

		/**
		* Gets all of the attachments for a document.
		*
		* @example
		* 	storage.getAllAttachments('exampleDoc').then(function(attachEntries) {
		* 		attachEntries.map(function(entry) {
		*			var a = entry.data;
		*			// do something with it...
		* 			if (a.type.indexOf('image') == 0) {
		*				// show image...
		*			} else if (a.type.indexOf('audio') == 0) {
		*				// play audio...
		*			} else ...
		*		})
		* 	})
		*
		* @method getAllAttachments
		* @param {string} [docKey] Identifies the document.  Defaults to `__emptydoc__`
		* @returns {promise} Promise that is resolved with all of the attachments for
		* the given document.
		*/
		getAllAttachments: function(docKey) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.getAllAttachments(docKey);
		},

		/**
		* Gets all attachments URLs for a document.
		*
		* @example
		* 	storage.getAllAttachmentURLs('exampleDoc').then(function(urlEntries) {
		*		urlEntries.map(function(entry) {
		*			var url = entry.url;
		* 			// do something with the url...
		* 		})
		* 	})
		*
		* @method getAllAttachmentURLs
		* @param {string} [docKey] Identifies the document.  Defaults to the `__emptydoc__` document.
		* @returns {promise} Promise that is resolved with all of the attachment
		* urls for the given doc.
		*/
		getAllAttachmentURLs: function(docKey) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.getAllAttachmentURLs(docKey);
		},

		/**
		* Revoke the attachment URL as required by the underlying
		* storage system.
		*
		* This is akin to `URL.revokeObjectURL(url)`
		* URLs that come from `getAttachmentURL` or `getAllAttachmentURLs` 
		* should be revoked by LLS and not `URL.revokeObjectURL`
		*
		* @example
		* 	storage.getAttachmentURL('doc', 'attach').then(function(url) {
		*		// do something with the URL
		*		storage.revokeAttachmentURL(url);
		* 	})
		*
		* @method revokeAttachmentURL
		* @param {string} url The URL as returned by `getAttachmentURL` or `getAttachmentURLs`
		* @returns {void}
		*/
		revokeAttachmentURL: function(url) {
			this._checkAvailability();
			return this._impl.revokeAttachmentURL(url);
		},

		/**
		* Remove an attachment from a document.
		*
		* @example
		* 	storage.rmAttachment('exampleDoc', 'someAttachment').then(function() {
		* 		alert('exampleDoc/someAttachment removed');
		* 	}).catch(function(e) {
		*		alert('Attachment removal failed: ' + e);
		* 	});
		*
		* @method rmAttachment
		* @param {string} docKey
		* @param {string} attachKey
		* @returns {promise} Promise that is resolved once the remove completes
		*/
		rmAttachment: function(docKey, attachKey) {
			if (!docKey) docKey = '__emptydoc__';
			this._checkAvailability();
			return this._impl.rmAttachment(docKey, attachKey);
		},

		/**
		* Returns the actual capacity of the storage or -1
		* if it is unknown.  If the user denies your request for
		* storage you'll get back some smaller amount of storage than what you
		* actually requested.
		*
		* TODO: return an estimated capacity if actual capacity is unknown?
		* -Firefox is 50MB until authorized to go above,
		* -Chrome is some % of available disk space,
		* -Safari unlimited as long as the user keeps authorizing size increases
		* -Opera same as safari?
		*
		* @example
		*	// the initialized property will call you back with the capacity
		* 	storage.initialized.then(function(capacity) {
		*		console.log('Authorized to store: ' + capacity + ' bytes');
		* 	});
		*	// or if you know your storage is already available
		*	// you can call getCapacity directly
		*	storage.getCapacity()
		*
		* @method getCapacity
		* @returns {number} Capacity, in bytes, of the storage.  -1 if unknown.
		*/
		getCapacity: function() {
			this._checkAvailability();
			if (this._impl.getCapacity)
				return this._impl.getCapacity();
			else
				return -1;
		},

		_checkAvailability: function() {
			if (!this._impl) {
				throw {
					msg: "No storage implementation is available yet.  The user most likely has not granted you app access to FileSystemAPI or IndexedDB",
					code: "NO_IMPLEMENTATION"
				};
			}
		}
	};

	LargeLocalStorage.contrib = {};

	return LargeLocalStorage;
})(Q);

	return LargeLocalStorage;
}

if (typeof define === 'function' && define.amd) {
	define(['Q'], definition);
} else {
	glob.LargeLocalStorage = definition.call(glob, Q);
}

}).call(this, this);