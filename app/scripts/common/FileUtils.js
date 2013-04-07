
/**
* @module common
* @author Matt Crinklaw-Vogt
*
*/


  define(function() {
    /**
    	* Utilities for working with files, file paths and URIs.
    	* @class common.FileUtils
    	*
    */

    var FileUtils;
    return FileUtils = {
      /**
      		* Returns the base name of the path
      		* e.g., baseName("path/to/some/file.txt") will return "file.txt"
      		* baseName("path/to/some/file.txt", "txt") will return "file"
      		* baseName("path/to/some/dir/") will return "dir"
      		* @method baseName
      		* @param {String} path the path
      		* @param {String} [extension] extension to be stripped
      		* @returns {String} base name
      		*
      */

      baseName: function(path, extension) {
        var idx;
        if (path[path.length - 1] === "/") {
          path = path.substring(0, path.length - 1);
        }
        idx = path.lastIndexOf("/");
        if (idx !== -1 && idx + 1 < path.length) {
          path = path.substring(idx + 1, path.length);
        }
        if (extension != null) {
          idx = path.lastIndexOf(extension);
          if (idx + extension.length === path.length) {
            path = path.substring(0, idx);
          }
        }
        return path;
      },
      /**
      		* Returns the image type of a URI based on its extension
      		* or data: attribute if it is a data url.
      		* @method imageType
      		* @param {String} uri url or data url to image
      		* @returns {String} upper case extension or data: type
      		*
      */

      imageType: function(uri) {
        var idx;
        if (uri.indexOf("data:") === 0) {
          idx = uri.indexOf(";");
          return uri.substring(11, idx).toUpperCase();
        } else {
          return FileUtils.extension(uri);
        }
      },
      /**
      		* Returns the extension of the file pointed to be the URI
      		* Ignores query parameters that are a part of the URI
      		* @method extension
      		* @param {String} uri uri to file
      		* @returns {String} upper case extension
      		*
      */

      extension: function(uri) {
        var extension, idx;
        idx = uri.lastIndexOf(".");
        if (idx !== -1 && idx + 1 < uri.length) {
          extension = uri.substring(idx + 1, uri.length);
          idx = extension.lastIndexOf("?");
          if (idx !== -1) {
            extension = extension.substring(0, idx);
          }
          return extension.toUpperCase();
        } else {
          return "";
        }
      },
      /**
      		* Converts an extension to a mime type
      		* @method type
      		* @param {String} extension Upper cased extension
      		* @returns {String} mime type
      		*
      */

      type: function(extension) {
        switch (extension) {
          case "MP4":
            return "video/mp4";
          case "WEBM":
            return "video/webm";
          case "OGG":
            return "video/ogg";
          default:
            return "";
        }
      },
      createDownloadAttrs: function(mimeType, value, name) {
        var attrs, blob, href;
        blob = new Blob([value], {
          type: mimeType
        });
        href = window.URL.createObjectURL(blob);
        attrs = {
          href: href,
          download: name,
          downloadurl: [mimeType, name, href].join(':')
        };
        return attrs;
      },
      toText: function(file, cb) {
        var reader;
        console.log(file.type);
        if (file != null) {
          reader = new FileReader();
          reader.onload = function(e) {
            return cb(e.target.result);
          };
          return reader.readAsText(file);
        }
      }
    };
  });

