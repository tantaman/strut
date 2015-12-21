define(['libs/backbone', 'css!styles/widgets/fileBrowser.css'],
        function (Backbone, empty) {
            return Backbone.View.extend({
                events: {
                    destroyed: 'dispose',
                    'click li[data-chartbookid]': '_fileClicked',
                    'click button.close': '_deleteClicked',
                    "click .pagenum": "_goToPage",
                    'dblclick li[data-chartbookid]': '_fileChosen'
                },
                className: "fileBrowser",
                initialize: function () {
                    this.render = this.render.bind(this);
                    this.storageInterface.on("change:currentProvider", this.render);

                    this.template = JST['tantaman.web.widgets/FileBrowser'];
                    this.saveTemplate = JST['tantaman.web.widgets/SaveChartBook'];
                    this.paginationTemplate = JST['tantaman.web.widgets/Pagination'];
                    
                    this.renderListing = this.renderListing.bind(this);
                },
                render: function (action) {
                    this.$el.html('<div class="browserContent">');
                    var cbName = this.editorModel.chartBookName();
                    if (action == "Save") {
                        this.$el.find('.browserContent').html(this.saveTemplate({
                            name: cbName == "ChartBook-unnamed" ? "" : cbName
                        }));
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
                _goToPage: function(e) {
                    var $this = $(e.currentTarget);
                    var page_num = $this.data("page");
                    $this.addClass("active").siblings().removeClass("active");
                    this.renderListing(page_num);
                },
                dispose: function () {
                    this.storageInterface.off(null, null, this);
                },
                _fileClicked: function (e) {
                    $(".promptPopup").addClass("hide");
                    this.$cb_ip_field.val(e.currentTarget.dataset.chartbookid);
                    this.$el.find('.active').removeClass('active');
                    $(e.currentTarget).addClass('active');
                },
                _fileChosen: function (e) {
                    this.$el.trigger('fileChosen', e.currentTarget.dataset.chartbookid);
                },
                _deleteClicked: function (e) {
                    var $target = $(e.currentTarget);
                    var $li = $target.parent().parent();
                    this.storageInterface.remove($li.attr('data-chartbookid'));
                    $li.remove();

                    e.stopPropagation();
                    return false;
                },
                renderListing: function (page_num) {
                    var self = this;
                    this.storageInterface.listPresentations("/", function (list, err, no_of_pages, showPages) {
                        
                        if (err) {
                            self.$el.find('.browserContent').html(err);
                        } else {
                            self.$el.find('.browserContent').html(self.template({files: list}));
                            if(showPages == 0){
                                self.$el.append(self.paginationTemplate({no_of_pages: no_of_pages, show_pages:showPages}));
                            }
                        }

                        self.$cb_ip_field = self.$el.find('.cb-ip-field');
                    }, page_num);
                },
                chartBookName: function () {
                    return this.$cb_ip_field.val();
                },
                constructor: function ProviderTab(storageInterface, editorModel) {
                    this.storageInterface = storageInterface;
                    this.editorModel = editorModel;
                    Backbone.View.prototype.constructor.call(this);
                }
            });
        });