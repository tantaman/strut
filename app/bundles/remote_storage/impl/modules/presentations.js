define(['../remoteStorage'], function (remoteStorage) {
  remoteStorage.defineModule('presentations', function(privateClient, publicClient) {
    var type = 'presentation';
    function PresentationStorage(client) {
      this.client = client;
    }

    PresentationStorage.prototype = {
      list: function(directory, cb) {
        return this.client.getListing((directory || ''), cb); // TODO: do I need to do any trimming of /'s?
      },

      get: function(path) {
        return this.client.getObject(path);
      },

      set: function(path, presentation) {
        this.client.storeObject(type, path, presentation);
        return this;
      },

      // TODO: add convenience methods for extract metadata from a presentation?

      remove: function(path) {
        this.client.remove(path);
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
