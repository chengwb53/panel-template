/**
 * Created by chengwb on 2016/8/27.
 * demo 功能待扩充
 */
(function(global, $, undefined){
    'use strict';

    global.panel = global.panel || {};

    var PanelTemplate = function(options) {
        this.options = options;

        this.init();
    };

    PanelTemplate.prototype.init = function() {
        this.initCell();
        this.initEvent();
    };

    PanelTemplate.prototype.initCell = function() {
        this.cell = this.cell || {};
        //待考虑ie小数点
        this.cell.width = this.options.width / this.options.xCells;
        this.cell.height = this.options.height / this.options.yCells;
    };

    PanelTemplate.prototype.initWarp = function() {
    };

    PanelTemplate.prototype.initEvent = function() {
        var self = this;
        var point;

        self.$el.on('mousedown', '.drag_point', function(event) {
            var startX = event.pageX;
            var startY = event.pageY;
            var pointCenter = self.options.center;//点的中心位置
            point = this;
            $('.drag_tip').css('display', 'inline-block');
            if(self.options.onDrag && typeof self.options.onDrag === 'function') {
                self.options.onDrag(event, {
                    x: startX - self.position.left,
                    y: startY - self.position.top
                })
            }

            $(window.document).on('mousemove', function(event) {
                //获取点在地图上的位置
                var pointPosition = $(point).position();
                //鼠标移动的距离
                var moveX = event.pageX - startX;
                var moveY = event.pageY - startY;
                //移动结束位置
                var endY= 0;
                var endX = 0;

                //判断鼠标位置是否在地图上
                var mouseX = event.pageX - self.position.left;
                var mouseY = event.pageY - self.position.top;
                if(mouseX < 0) {
                    endX = -(pointCenter.left);
                } else if(mouseX >= self.range.width) {
                    endX = self.range.width - pointCenter.left;
                } else {
                    endX = pointPosition.left + moveX;
                }

                if(mouseY < 0){
                    endY = -(pointCenter.top);
                } else if(mouseY >= self.range.height) {
                    endY = self.range.height - pointCenter.top;
                } else {
                    endY = pointPosition.top + moveY;
                }

                //检查位置是否超出了地图，如果超出则只移动到地图边缘
                var centerX = endX + pointCenter.left;
                var centerY = endY + pointCenter.top;
                if(centerX >= self.range.width) {
                    endX = self.range.width - pointCenter.left;
                } else if(centerX < 0) {
                    endX = -(pointCenter.left);
                }
                if(centerY >= self.range.height) {
                    endY = self.range.height - pointCenter.top;
                } else if(centerY < 0) {
                    endY = -(pointCenter.top);
                }

                //设置移动后的位置
                $(point).css({
                    top: endY + 'px',
                    left: endX + 'px'
                });

                if(self.options.onDrag && typeof self.options.onDrag === 'function') {
                    self.options.onDrag(event, {
                        x: endX + pointCenter.left,
                        y: endY + pointCenter.top
                    })
                }

                startX = event.pageX;
                startY = event.pageY;
            });

            $(window.document).on('mouseup', function() {
                $(window.document).off('mousemove');
                //$('.drag_tip').css('display', 'none');

                if(point) {
                    var position = $(point).position();
                    if(self.options.endDrag && typeof self.options.endDrag === 'function'){
                        self.options.endDrag({
                            x: position.left + self.options.center.left,
                            y: position.top + self.options.center.top
                        });
                    }
                }

                $(window.document).off('mouseup');
            });
        });
    };

    PanelTemplate.prototype.addPoint = function(points) {
        var top = 0;
        var left = 0;

        if(points && $.isArray(points)) {
            for(var i = 0; i < points.length; i++) {
                top = options.y || 0;
                left = options.x || 0;

                var style = 'top:' + top + ';left:' + left + ';';
                this.$el.append('<span class="drag_point" style="' + style + '"></span>');
            }
        } else {
            this.$el.append('<span class="drag_point" style="top:0;left:0;"></span>');
        }

        this.$el.find('.drag_point').css({
            width: this.options.width || PanelTemplate.DEFAULTS.width + 'px',
            height: this.options.height || PanelTemplate.DEFAULTS.height + 'px'
        });
    };

    PanelTemplate.DEFAULTS = {
        width: 1200,
        height: 900,
        xCells: 4,
        yCells: 3,
        onClick: function(e) {
            return false;
        },
        onDrag: function(e, position) {
            return false;
        },
        endDrag: function(position) {
            return position;
        }
    };

    var allowedMethods = [
        'createModule'
    ];

    $.fn.insertPanel = function(option) {
        var value,
            args = Array.prototype.slice.call(arguments, 1);

        this.each(function () {
            var $this = $(this),
                data = $this.data('drag'),
                options = $.extend({}, PanelTemplate.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw new Error("Unknown method: " + option);
                }

                if (!data) {
                    return;
                }

                value = data[option].apply(data, args);

                if (option === 'destroy') {
                    $this.removeData('drag');
                }
            }

            if (!data) {
                $this.data('drag', (data = new PanelTemplate(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

})(jQuery);