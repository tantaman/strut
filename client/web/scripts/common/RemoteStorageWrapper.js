(function() {

var root = this;
if (!Function.bind) {
	Function.bind = function(context) {
		var self = this;
		return function() {
			self.apply(context, arguments);
		};
	};
}

function RemoteStorageWrapper(tokenReceiver, remoteStorage) {
	remoteStorage || (remoteStorage = root.remoteStorage);
	this.remoteStorage = remoteStorage;
	this.tokenReceiver = tokenReceiver;
}

RemoteStorageWrapper.prototype = {
	constructor: RemoteStorageWrapper,

	openStorage: function(userAddress, category, cb) {
		var futureClient = new FutureClient(userAddress, category, cb, this.remoteStorage, this.tokenReceiver);
		this.remoteStorage.getStorageInfo(userAddress, futureClient.storageInfoReceived);
		return this;
	}
};

// This is kind of ugly...
function FutureClient(userAddress, category, cb, remoteStorage, tokenReceiver) {
	this._userAddress = userAddress;
	this._category = category;
	this._cb = cb;
	this._remoteStorage = remoteStorage;
	this._tokenReceiver = tokenReceiver;

	this._authCompleted = this._authCompleted.bind(this);
	this.storageInfoReceived = this.storageInfoReceived.bind(this);
	root.addEventListener('message', this._authCompleted, false);
}

FutureClient.prototype = {
	_authCompleted: function(event) {
    	if (event.origin == location.protocol +'//'+ location.host) {
    		if (this._popup)
    			this._popup.close()
    		localStorage.setItem("remoteStorageToken", event.data);
      		this._cb(null, this._createClient(event.data));
    	}
  	},

  	_destroy: function() {
  		root.removeEventListener('message', this._authCompleted, false);
  	},

  	_createClient: function(token) {
  		return this._remoteStorage.createClient(this._storageInfo, this._category, token);
  	},

	storageInfoReceived: function(err, storageInfo) {
		if (err != null) {
			this._destroy();
			this._cb(err);
			return err; // Use a promise?
		}

		this._storageInfo = storageInfo;
		var token = remoteStorage.receiveToken() || localStorage.getItem("remoteStorageToken");
		if (token) {
			this._cb(null, this._createClient(token));
		} else {
			var oauthPage = remoteStorage.createOAuthAddress(storageInfo, 
				[this._category], 
				this._tokenReceiver);
			this._popup = window.open(oauthPage);
		}
	}
}

root.RemoteStorageWrapper = RemoteStorageWrapper;

})(this);