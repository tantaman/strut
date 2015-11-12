/*
 @author Matt Crinklaw-Vogt
 */
define(['libs/backbone'],
        function (Backbone) {
            var modalCache = {};
            var Modal = Backbone.View.extend({
                className: "chartGallery modal hide",
                events: {
                    "click .ok": "okClicked",
                    "click .prev": "prevPage",
                    "click .next": "nextPage",
                    "click .thumbnail": "_selectChart",
                    "hidden": "hidden"
                },
                initialize: function () {
                    this.selectedCharts = {};
                },
                okClicked: function () {
                    if (!this.$el.find(".ok").hasClass("disabled")) {
                        $.each(this.selectedCharts, function (i, selectedChart) {
                            this.cb(selectedChart); // cb = GalleryComponentButton._itemImported() 
                        }.bind(this));
                        this.selectedCharts = {};
                        return this.$el.modal('hide');
                    }
                },
                show: function (cb) {
                    this.cb = cb;
                    return this.$el.modal('show');
                },
                _showGallery: function (page) {
                    this.galleryElement = this.$el.find("#chart-gallery-body");
                    if (this.galleryElement.find(".thumbnail").length != 0 && (page == undefined || page.trim() == ""))
                        return;
                    this.galleryElement.empty();
//                    $.ajax({  
//                       url : page ? page : "https://api.icharts.net/v1/charts/?sortBy=createdDate",
//                       type : "get",
//                       success : function(resp){
//
//                       }
//                    });
                    // building dummy response to work until we get api ready
                    var resp = {
                        previous: "",
                        next: "https://api.icharts.net/v1/charts/?sortBy=createdDate&offset=0",
                        offset: 0, //<index of the first object returned in this query>
                        total: 20, //<total number of objects>
                        perPage: 10,
                        results: [
                            {
                                chartId: "MH7Szi9N",
                                chartType: "COLUMN_CHART",
                                subType: '100%25',
                                height: "589",
                                width: "435",
                                name: "Segment Performance by Market",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/946ddf8a32b3b660ffd8/thumbnail.png"
                            },
                            {
                                chartId: "MH7SzixF",
                                chartType: "COLUMN_CHART",
                                subType: '100%25',
                                height: "591",
                                width: "437",
                                name: "Dynamic Market Brand Composition",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/7115f7a0393de96f2fdc/thumbnail.png"
                            },
                            {
                                chartId: "MH7Szi9B",
                                chartType: "COLUMN_CHART",
                                subType: 'stacked',
                                height: "623",
                                width: "469",
                                name: "Container Meterials Sold by Trademark",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/248bac3b8e354a9103c4/thumbnail.png"
                            },
                            {
                                chartId: "MHrbyilF",
                                chartType: "COLUMN_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "NWEA Map Reading Growth Fall 2013 - Spring 2014",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/467f1a0db47753cc630e/thumbnail.png"
                            },
                            {
                                chartId: "M3nawitG5",
                                chartType: "BAR_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "bigqueryforsalesforce",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/9e7296f5c3f02c8b77f7/thumbnail.png"
                            },
                            {
                                chartId: "MHvWzixC2",
                                chartType: "COLUMN_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Zusammensetzungen der Erdgaspreise für Haushalte in Prozent",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/946ddf8a32b3b660ffd8/thumbnail.png"
                            },
                            {
                                chartId: "MHjRzCJB2",
                                chartType: "PIE_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Endenergieverbrauch der Haushalte 2012 nach Anwendungsarten",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/7115f7a0393de96f2fdc/thumbnail.png"
                            },
                            {
                                chartId: "M3PbySJG2",
                                chartType: "LINE_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Title ..",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/248bac3b8e354a9103c4/thumbnail.png"
                            },
                            {
                                chartId: "MHrbyilF2",
                                chartType: "COLUMN_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "NWEA Map Reading Growth Fall 2013 - Spring 2014",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/467f1a0db47753cc630e/thumbnail.png"
                            },
                            {
                                chartId: "M3nawitG52",
                                chartType: "BAR_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "bigqueryforsalesforce",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/9e7296f5c3f02c8b77f7/thumbnail.png"
                            },
                            {
                                chartId: "MHvWzixC3",
                                chartType: "COLUMN_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Zusammensetzungen der Erdgaspreise für Haushalte in Prozent",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/946ddf8a32b3b660ffd8/thumbnail.png"
                            },
                            {
                                chartId: "MHjRzCJB3",
                                chartType: "PIE_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Endenergieverbrauch der Haushalte 2012 nach Anwendungsarten",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/7115f7a0393de96f2fdc/thumbnail.png"
                            },
                            {
                                chartId: "M3PbySJG3",
                                chartType: "LINE_CHART",
                                subType: '',
                                height: "400",
                                width: "560",
                                name: "Title ..",
                                imageUrl: "http://bl.ocks.org/mbostock/raw/248bac3b8e354a9103c4/thumbnail.png"
                            }
                        ]
                    }
                    var galleryData = {
                        previous: resp.previous,
                        next: resp.next,
                        offset: resp.offset, //<index of the first object returned in this query>
                        total: resp.total, //<total number of objects>
                        perPage: resp.perPage
                    };
                    this.galleryElement.data("gallery", galleryData);
                    this._thumbnailProperties = this._getThumbnailProperties(resp.perPage);
                    var chartList = resp.results;
                    $.each(chartList, function (i, v) {
                        if (i >= resp.perPage)
                            return false;
                        this._showChartThumbnail(v);
                    }.bind(this));

                },
                _getThumbnailProperties: function (perPage) {
                    var totalWidth = this.galleryElement.width();
                    var perRow = 4;
                    var margin = 16;
                    var width = (totalWidth - (perRow * margin * 2)) / perRow;
                    return {"width": width, "margin": margin};
                },
                _showChartThumbnail: function (chartData) {
                    var gallery = this.galleryElement;
                    var buffer = '';
                    buffer += '<div id="chart-gallery-' + chartData.chartId + '" class="thumbnail">' +
                            '<div class="title"><p>' + chartData.name + '</p></div>' +
                            '</div>';
                    gallery.append(buffer);
                    var chartThumbnail = $("#chart-gallery-" + chartData.chartId);

                    chartThumbnail.css({
                        "width": this._thumbnailProperties.width,
                        "margin": this._thumbnailProperties.margin + "px",
                        "background-image": 'url(\"' + chartData.imageUrl + '\")'
                    });
                    var location = "htmlcharts2.icharts.net";

                    chartData.url = "https://" + location + "/?chartid=" + chartData.chartId + "&charttype=" + chartData.chartType + "&subtype=" + chartData.subType + "&authentication={}";

                    chartThumbnail.data("chart", chartData);
                },
                prevPage: function () {
                    var galleryData = $("#chart-gallery-body").data("gallery");
                    this._showGallery(galleryData.previous);
                },
                nextPage: function () {
                    var galleryData = $("#chart-gallery-body").data("gallery");
                    this._showGallery(galleryData.next);
                },
                _selectChart: function (e) {
                    var $this = $(e.currentTarget);
                    if($this.hasClass("selected")){
                        $this.removeClass("selected");
                        delete this.selectedCharts[$this.data("chart").chartId];   
                    }
                    else{
                        $this.addClass("selected");
                        
                        this.selectedCharts[$this.data("chart").chartId] = $this.data("chart");
                    }
                },
                hidden: function () {
                    if (this.$input != null) {
                        this.item.src = '';
                        return this.$input.val("");
                    }
                },
                _itemLoadError: function () {
                    this.$el.find(".ok").addClass("disabled");
                    return this.$el.find(".alert").removeClass("dispNone");
                },
                _itemLoaded: function () {
                    this._showGallery();
                    this.$el.find(".ok").removeClass("disabled");
                    return this.$el.find(".alert").addClass("dispNone");
                },
                // should probably just make a sub component to handle progress
                _updateProgress: function (ratio) {
                    this.$progressBar.css('width', ratio * 100 + '%');
                },
                _switchToProgress: function () {
                    this.$thumbnail.addClass('dispNone');
                    this.$progress.removeClass('dispNone');
                },
                render: function () {
                    var _this = this;
                    this.$el.html(JST["tantaman.web.widgets/ChartGalleryModal"](this.options));
                    this.$el.modal();
                    this.$el.modal("hide");
                    this.item = this.$el.find("#chart-gallery-body");

                    //to do : change this functionality based on chart selected in gallery
                    if (!this.options.ignoreErrors) {
                        this.item.onerror = function () {
                            return _this._itemLoadError();
                        };
                        this.item.onload = function () {
                            return _this._itemLoaded();
                        };
                    }

                    this.$progress = this.$el.find('.progress');
                    this.$progressBar = this.$progress.find('.bar');
                    return this.$el;
                },
                constructor: function ChartGalleryModal() {
                    Backbone.View.prototype.constructor.apply(this, arguments);
                }
            });

            return {
                //remembers the model if it is opened and returns it. No need of building template every time.  
                get: function (options) {
                    var previous = modalCache[options.tag];

                    if (!previous) {
                        previous = new Modal(options);
                        previous.$el.bind('destroyed', function () {
                            delete modalCache[options.tag];
                        });

                        modalCache[options.tag] = previous;

                        previous.render();
                        $('#modals').append(previous.$el);
                    }

                    return previous;
                },
                ctor: Modal
            };
        });
