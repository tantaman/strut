define(['libs/backbone',
    './SlideWell',
    './OperatingTable',
    './MarkdownEditor', './shareWindow'],
        function (Backbone, SlideWell, OperatingTable, MarkdownEditor, shareWindow) {
            'use stict';
            return Backbone.View.extend({
                className: 'slideEditor',
                initialize: function () {
                    //this._template = JST['strut.slide_editor/SlideEditor'];
                    this._shareWIndow = new shareWindow();
                    this._well = new SlideWell(this.model._editorModel);
                    this._opTable = new OperatingTable(this.model._editorModel, this.model);
                    this._markdownEditor = new MarkdownEditor({
                        $target: this._opTable.$el
                    });

                    this._prevSlide = this.model.activeSlide();
                    this.model.on('change:mode', this._modeChanged, this);
                    this.model.deck().on('change:activeSlide', this._activeSlideChanged, this);
                    this.model.on('saveEdits', this._saveCurrentEdits, this);
                    // $(document.body).css('overflow', 'hidden');
                },
                remove: function () {
                    Backbone.View.prototype.remove.call(this);
                    this.model.dispose();
                    this._opTable.dispose();
                    this.model.deck().off(null, null, this);
                },
                render: function () {
                    this.$el.html();
                    this.$el.append(this._well.render().$el);
                    this.$el.append(this._opTable.render().$el);
                    this._shareWIndow.render();
                    $(document).ready(function () {
                        $('.tabs .tab-links a').on('click', function (e) {
                            var currentAttrValue = jQuery(this).attr('href');

                            // Show/Hide Tabs
                            $('.tabs ' + currentAttrValue).show().siblings().hide();

                            // Change/remove current tab to active
                            $(this).parent('li').addClass('active').siblings().removeClass('active');

                            e.preventDefault();

                        });
                        
                        $(".all").on("click", function(){
                            var status = $(this).prop('checked') ? true : false;
                           $(this).parent().siblings().find("input[type='checkbox']").prop( "checked", status );
                        });
                    });
                    return this;
                },
                _activeSlideChanged: function (deck, slide) {
                    this._saveCurrentEdits();
                    this._prevSlide = slide;
                    this._markdownEditor.setValue(slide && slide.get('markdown'));
                },
                _modeChanged: function (model, mode) {
                    if (mode == 'markdown') {
                        this._markdownEditor.show(this.model.activeSlide().get('markdown'));
                    } else if (mode == 'preview') {
                        this.model.activeSlide().set('markdown', this._markdownEditor.getValue());
                        this._markdownEditor.hide();
                    } else {
                        throw "Illegal mode";
                    }
                },
                _saveCurrentEdits: function () {
                    if (this._prevSlide && this.model.isMarkdownMode()) {
                        this._prevSlide.set('markdown', this._markdownEditor.getValue());
                    }
                },
                
                constructor: function SlideEditorView() {
                    Backbone.View.prototype.constructor.apply(this, arguments);
                }
            });
        });