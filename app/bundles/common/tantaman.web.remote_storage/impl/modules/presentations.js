define(['../remoteStorage'], function (remoteStorage) {
  remoteStorage.defineModule('presentations', function(privateClient, publicClient) {
    var type = 'presentation';
    function PresentationStorage(client) {
      this.client = client;
    }

    PresentationStorage.prototype = {
      list: function(directory, cb) {
        return this.client.getListing((directory || ''))
          .then(cb);
      },

      get: function(path, cb) {
        return this.client.getFile(path).then(function(file) {
          cb(JSON.parse(file.data));
        });
      },

      set: function(path, presentation, cb) {
        // We don't want schema validation.  Doing storeFile.
        this.client.storeFile('text/plain', path, JSON.stringify(presentation)).then(cb);
        return this;
      },

      remove: function(path, cb) {
        this.client.remove(path).then(cb);
        return this;
      }
    };

    return {
      name: 'presentations',
      dataVersion: '0.1',
      dataHints: {
        "module": "Presentations are things that you present or talk about to a group",
        
        "objectType presentation": "Work to be presented",
        
        "directory presentations/": "Default location for private presentations",
        "directory public/presentations/": "Default location for public presentations"
      },
      codeVersion: '0.1.0',
      exports: {
        public: new PresentationStorage(publicClient),
        private: new PresentationStorage(privateClient)
      }
    };
  });

  return remoteStorage.presentations;
});
