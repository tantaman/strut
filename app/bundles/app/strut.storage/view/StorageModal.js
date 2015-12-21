define(['libs/backbone', 'tantaman/web/widgets/FileBrowser', 'css!styles/storage/storageModal.css'],
        function (Backbone, FileBrowser, PromptPopup) {

            return Backbone.View.extend({
                className: "storageModal modal hide",
                events: {
                    'click a[data-provider]': '_providerSelected',
                    'click .ok': '_okClicked',
                    'destroyed': 'dispose',
                    'click .close': 'clear'
                },
                initialize: function () {
                    this.storageInterface = this.options.storageInterface;
                    this.editorModel = this.options.editorModel;
                    delete this.options.storageInterface;
                    delete this.options.editorModel;

                    this.template = JST['strut.storage/StorageModal'];

                    this.storageInterface.on('change:providers', this.render, this);
                    this.storageInterface.on('change:currentProvider', this._providerChanged, this);

                    this.fileBrowser = new FileBrowser(this.storageInterface, this.editorModel);
                },
                title: function (title) {
                    this.$el.find('.title').html(title);
                },
                clear: function () {
                    this.$el.find(".warning").html("");
                },
                action: function (action) {
                    this.$el.find('.ok').html(action)
                            .data("action", action);
                },
                dispose: function () {
                    this.storageInterface.off(null, null, this);
                },
                render: function () {
                    // Create a tab for each provider?
                    // Each tab will list the presentations currently saved with that provider
                    // and also have a 'save' or 'open' button.

                    // Don't load the data for a provider until its tab is selected...
                    var providerNames = this.storageInterface.providerNames();
                    this.$el.html(this.template({
                        title: this.__title()

                    }));

                    this._providerChanged();

                    this.$el.find('.tabContent').append(this.fileBrowser.render().$el);
                },
                show: function (actionHandler, title, action) {
                    this.actionHandler = actionHandler;
                    this.title(title);
                    this.action(action);
                    this.$el.modal('show');
                    this.fileBrowser.render(action);
                },
                _providerChanged: function () {
                    if (this.$lastProviderTab) {
                        this.$lastProviderTab.removeClass('active');
                    }

                    this.$lastProviderTab =
                            this.$el.find('[data-provider="' +
                                    this.storageInterface.currentProviderId() + '"]').parent();

                    this.$lastProviderTab.addClass('active');
                },
                __title: function () {
                    return 'none';
                },
                _okClicked: function () {
                    this.$el.find(".ok").addClass("inactive");
                    this.$el.find(".warning").html("");
                    var cb = this.$el.find(".cb-ip-field");
                    var action = this.$el.find(".ok").data("action");
                    if (this.actionHandler) {
                        if (cb.val().trim() == "" || cb.val() == undefined) {
                            self.$el.find(".ok").removeClass("inactive");
                            if (action == "Save") {
                                this.$el.find(".warning").html("Enter ChartBook Name ...");
                            }
                            else {
                                this.$el.find(".warning").html("Enter ChartBook ID / Select a ChartBook");
                            }
                        }
                        else {
                            var self = this;
                            this.actionHandler(this.storageInterface, this.editorModel,
                                    this.fileBrowser.chartBookName(),
                                    function (resp, err) {
                                        if (!err) {
                                            if (resp) {
                                                self.$el.find(".warning").addClass("hide");
                                                self.$el.find(".success").html(resp.msg);
                                                self.$el.find(".response").html(resp.result).attr("href", resp.result);
                                            }
                                            if (action == "Save" || action == "Delete") {
                                                setTimeout(function () {
                                                    self.$el.find(".ok").removeClass("inactive");
                                                    self.$el.modal('hide');
                                                }, 4000);
                                            }
                                            else{
                                                self.$el.find(".ok").removeClass("inactive");
                                                self.$el.modal('hide');
                                            }
                                        } else {
                                            self.$el.find(".ok").removeClass("inactive");
                                            if (resp)
                                                self.$el.find(".warning").html(resp.msg);
                                            else
                                                self.$el.find(".warning").html(err);
                                        }

                                    });
                        }

                    }
                },
                _providerSelected: function (e) {
                    // change the storage interface's selected
                    // storage provider
                    this.storageInterface.selectProvider(e.target.dataset.provider);
                },
                constructor: function AbstractStorageModal() {
                    Backbone.View.prototype.constructor.apply(this, arguments);
                }
            });
        });