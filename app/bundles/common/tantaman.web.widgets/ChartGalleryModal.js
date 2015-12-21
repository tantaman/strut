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
                    "click .chart-gallery-pagenum": "_goToPage",
                    "click #chart-gallery-pages .more": "_navigatePages",
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
                    var perPage = 10;
                    var that = this;
                    this.galleryElement = this.$el.find("#chart-gallery-body");
                    
                    //to prevent loading same gallery again if popup closed and opened. 
                    if (this.galleryElement.find(".thumbnail").length != 0 && (page == undefined))
                        return;
                    page = page ? page : 0;
                    this.galleryElement.empty();
                    $.ajax({
                        url: page ? page : "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/charts",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                        },
                        data: {
                          "perPage": perPage, "offset": perPage*page,
                        },
                        success: function (resp) {
                            var galleryData = {
                                previous: resp.previous,
                                next: resp.next,
                                offset: resp.offset, //<index of the first object returned in this query>
                                total: resp.total, //<total number of objects>
                                perPage: resp.perPage
                            };
                            that.galleryElement.data("gallery", galleryData);
                            that._thumbnailProperties = that._getThumbnailProperties(resp.perPage);
                            var chartList = resp.results;
                            $.each(chartList, function (i, v) {
                                if (i >= resp.perPage)
                                    return false;
                                this._showChartThumbnail(v, resp.offset + i);
                            }.bind(that));
                            if (!$("#chart-gallery-pages").find(".chart-gallery-pagenum").length)
                                that._showPagination(galleryData);
                        }
                    });                   
                },
                _showPagination: function (galleryData){
                    var no_of_pages = Math.ceil(galleryData.total/galleryData.perPage) ;
                    var hide;
                    $("#chart-gallery-pages").append("<a class='more prevPages hide'><<</a>");
                    for(var i=0 ; i < no_of_pages; i++){
                        hide = false;
                        
                        if(i > 4 && no_of_pages > 5){
                            hide = true;
                        }
                        $("#chart-gallery-pages").append("<a href='#' data-page = '"+i+"' class='chart-gallery-pagenum"+(i==0?" active":" ")+""+(hide?" hide":" ")+"'>"+(i+1)+"</a>");
                        if(i == no_of_pages-1){
                            $("#chart-gallery-pages").append("<a class='more nextPages'>>></a>");
                        }
                    }
                },
                _getThumbnailProperties: function (perPage) {
                    var totalWidth = this.galleryElement.width();
                    var perRow = 3, height = 120;
                    var margin = 16, border = 1, padding = 6, extra_width_for_vslider = 20;
                    var width = Math.floor((totalWidth - (perRow * (margin + border + padding) * 2) - extra_width_for_vslider) / perRow);
                    var bg_size = width+"px "+(height-10)+"px";
                    return {"width": width, "height":height,"margin": margin, "bgsize": bg_size};
                },
                _showChartThumbnail: function (chartData, chartNumber) {
                    var gallery = this.galleryElement;
                    var buffer = '';
                    buffer += '<div id="chart-gallery-' + chartNumber + '" data-chartid ="'+chartData.chartId+'" class="thumbnail">' +
                            '<div class="title"><p>' + chartData.chartName + '</p></div>' +
                            '</div>';
                    gallery.append(buffer);
                    var chartThumbnail = $("#chart-gallery-" + chartNumber);

                    chartThumbnail.css({
                        "width": this._thumbnailProperties.width,
                        "height": this._thumbnailProperties.height,
                        "background-size": this._thumbnailProperties.bgsize,
                        "margin": this._thumbnailProperties.margin + "px",
                        "background-image": 'url(\"' + "https://"+ chartData.imageURL + '\")'
                    });
                    var location = "stageaccounts2.icharts.net";

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
                _goToPage: function(e) {
                    var $this = $(e.currentTarget);
                    var page_num = $this.data("page");
                    $this.addClass("active").siblings().removeClass("active");
                    this._showGallery(page_num);
                },
                _navigatePages: function(e) {
                    var $this = $(e.currentTarget);
                    var pageNums = $("#chart-gallery-pages").find(".chart-gallery-pagenum");
                    var no_of_pages = pageNums.length;
                    
                    if ($this.hasClass("prevPages")) {
                        var target = $("#chart-gallery-pages").find(".chart-gallery-pagenum:not(.hide)").first();
                        var page_num = target.data("page");
                        $this.siblings(".nextPages").removeClass("hide");
                        target.prevAll().each(function(i){
                            if(i==4)
                                return false;
                            $(this).removeClass("hide");
                            pageNums.eq(page_num+4-i).addClass("hide");   
                            if(page_num+i == 0)
                                $this.addClass("hide");
                        });
                    }
                    else if ($this.hasClass("nextPages")) {
                        var target = $("#chart-gallery-pages").find(".chart-gallery-pagenum:not(.hide)").last();
                        var page_num = target.data("page");
                        $this.siblings(".prevPages").removeClass("hide");
                        target.nextAll().each(function(i){
                            if(i==4)
                                return false;
                            $(this).removeClass("hide");
                            pageNums.eq(page_num-4+i).addClass("hide");   
                            if(page_num+i == no_of_pages-1)
                                $this.addClass("hide");
                        });
                        
                    }
                    
                },
                _selectChart: function (e) {
                    var $this = $(e.currentTarget);
                    if ($this.hasClass("selected")) {
                        $this.removeClass("selected");
                        delete this.selectedCharts[$this.data("chart").chartId];
                    }
                    else {
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