define(['libs/backbone', 'css!styles/widgets/fileBrowser.css'],
        function (Backbone, empty) {
            return Backbone.View.extend({
                events: {
                    destroyed: 'dispose',
                    'click li[data-chartbookname]': '_fileClicked',
                    'click button.close': '_deleteClicked',
                    'dblclick li[data-chartbookname]': '_fileChosen'
                },
                className: "fileBrowser",
                initialize: function () {
                    this.render = this.render.bind(this);
                    this.storageInterface.on("change:currentProvider", this.render);

                    this.template = JST['tantaman.web.widgets/FileBrowser'];
                    this.saveTemplate = JST['tantaman.web.widgets/SaveChartBook'];

                    this.renderListing = this.renderListing.bind(this);
                },
                render: function (action) {
                    this.$el.html('<div class="browserContent">');
                    if (action == "Save") {
                        this.$el.find('.browserContent').html(this.saveTemplate());
                    }
                    else {
                        if (this.storageInterface.providerReady(this.$el)) {
                            this.renderListing();
                        } else {
                            this.storageInterface.activateProvider(this.$el, this.renderListing);
                        }
                    }


                    return this;
                },
                dispose: function () {
                    this.storageInterface.off(null, null, this);
                },
                _fileClicked: function (e) {
                    this.$chartBookName.val(e.currentTarget.dataset.chartbookname);
                    this.$el.find('.active').removeClass('active');
                    $(e.currentTarget).addClass('active');
                },
                _fileChosen: function (e) {
                    this.$el.trigger('fileChosen', e.currentTarget.dataset.chartbookname);
                },
                _deleteClicked: function (e) {
                    var $target = $(e.currentTarget);
                    var $li = $target.parent().parent();
                    this.storageInterface.remove($li.attr('data-chartbookname'));
                    $li.remove();

                    e.stopPropagation();
                    return false;
                },
                renderListing: function () {
                    var self = this;
                    this.storageInterface.listPresentations("/", function (list, err) {
                        if (err) {
                            self.$el.find('.browserContent').html(err);
                        } else {
                            self.$el.find('.browserContent').html(self.template({files: list}));
                        }

                        self.$chartBookName = self.$el.find('.chartBookName');
                    });
                },
                chartBookName: function () {
                    return this.$chartBookName.val();
                },
                constructor: function ProviderTab(storageInterface, editorModel) {
                    this.storageInterface = storageInterface;
                    this.editorModel = editorModel;
                    Backbone.View.prototype.constructor.call(this);
                }
            });
        });