 define(["libs/jszip",
         "strut/deck/Deck",
         "strut/presentation_generator/impress/ImpressGenerator", // TODO: this should go thru the service registry
         "common/FileUtils"],
  function(JSZip, Deck, ImpressRenderer, FileUtils) {
    var Archiver, defaults;
    defaults = {
      includeImages: true,
      includeFonts: true
    };
    return Archiver = (function() {
      function Archiver(presentation, options) {
        this.presentation = presentation;
        this.options = options;
        this.options || (this.options = {});
        this.canvas = $("<canvas></canvas>")[0];
        this._archivedImages = {};
        this._imageIdx = 0;
        _.defaults(this.options, defaults);
      }

      Archiver.prototype.create = function() {
        var presentationCopy, showStr,
          _this = this;
        this.archive = new JSZip();
        this.previewExportDir = this.archive.folder("preview_export");
        this.imagesDir = this.previewExportDir.folder("images");
        this.scriptsDir = this.previewExportDir.folder("scripts");
        this.fontsDir = this.previewExportDir.folder("fonts");
        this.cssDir = this.previewExportDir.folder("css");
        presentationCopy = new Deck();
        presentationCopy["import"](this.presentation.toJSON(false, true));
        presentationCopy.get("slides").each(function(slide) {
          return _this.processComponents(slide.get("components"));
        });
        showStr = "<!doctype html><html>" + ImpressRenderer.render(presentationCopy.attributes) + "</html>";
        this._archiveIndexHtml(showStr);
        this._archiveScripts();
        this._archiveFonts();
        this._archiveCss();
        this._archivedImages = {};
        return this.archive.generate();
      };

      Archiver.prototype.createSimple = function(cb, opts) {
        var showStr,
          _this = this;
        this.archive = new JSZip();
        this.previewExportDir = this.archive.folder("preview_export");
        this.scriptsDir = this.previewExportDir.folder("scripts");
        this.cssDir = this.previewExportDir.folder("css");
        showStr = "<!doctype html><html>" + ImpressRenderer.render(this.presentation.attributes) + "</html>";
        this._archiveIndexHtml(showStr);
        return this._archiveScripts(function() {
          return _this._archiveCss(function() {
            return cb(_this.archive.generate(opts));
          });
        });
      };

      Archiver.prototype.processComponents = function(components) {
        var _this = this;
        return components.forEach(function(component) {
          return _this.processComponent(component);
        });
      };

      Archiver.prototype.processComponent = function(component) {
        if (component.get("type") === "ImageModel") {
          if (this.options.includeImages) {
            return this._archiveImage(component);
          }
        }
      };

      Archiver.prototype._archiveIndexHtml = function(str) {
        return this.archive.file("index.html", str);
      };

      Archiver.prototype._archiveScripts = function(cb) {
        var _this = this;
        return $.get('preview_export/scripts/impress.js', function(impress) {
          _this.scriptsDir.file('impress.js', impress);
        }) && $.get('preview_export/scripts/impressConsole.js', function(impressConsole) {
           _this.scriptsDir.file('impressConsole.js', impressConsole);
          return cb();
        });
      };

      Archiver.prototype._archiveFonts = function() {};

      Archiver.prototype._archiveCss = function(cb) {
        var _this = this;
        return $.get('zip/main.css', function(css) {
          _this.cssDir.file('main.css', css);
        }) && $.get('zip/impressConsole.css', function(css) {
          _this.cssDir.file('impressConsole.css', css);
          return cb();
        });
      };

      Archiver.prototype._archiveImage = function(component) {
        var fileName, img;
        if (!this._archivedImages[component.get("src")]) {
          this._archivedImages[component.get("src")] = true;
          img = component.cachedImage;
          this.canvas.width = img.naturalWidth;
          this.canvas.height = img.naturalHeight;
          this.canvas.getContext("2d").drawImage(img, 0, 0);
          fileName = this._imageIdx + FileUtils.baseName(component.get("src"));
          this.imagesDir.file(fileName, this.canvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, ""), {
            base64: true
          });
          return component.set("src", "preview_export/images/" + fileName);
        }
      };

      return Archiver;

    })();
    /*
    		var zip = new JSZip();
    		zip.file("Hello.txt", "Hello World\n");
    		var img = zip.folder("images");
    		img.file("smile.gif", imgData, {base64: true});
    		var content = zip.generate();
    		location.href="data:application/zip;base64,"+content;
    */

  });
