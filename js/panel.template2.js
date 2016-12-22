/**
 * Created by chengwb on 2016/9/5.
 * demo 功能待扩充
 * 备注：整个文件内坐标表示单元块坐标（例：模板大小为2*2，有4个单元块，则单元块的坐标有（0,0）（0,1）（1,0）（1,1）），
 *      位置表示相对于root元素的像素位置
 */
(function (global, $, undefined) {
    'use strict';
    var templates = [];//暂时保存模板，以名字为id

    function PanelTemplate(root, options) {
        var defaults = {
            xCells: 4,
            yCells: 3,
            onClick: function (e) {
                return false;
            },
            onDrag: function (e, position) {
                return false;
            },
            endDrag: function (position) {
                return position;
            },
            resizeX: 3,
            resizeY: 3
        };
        var options = $.extend(defaults, options);
        var $panel = $(root);
        var $_panel = $panel.clone();
        var width = 1200;
        var height = 900;
        var position = {};
        var modules = [];//设置为数组，length变量不可被枚举，按map来使用
        var moduleIndex = 0;
        var self = this;
        var templateEvent;
        var panelResizeEvent;

        modules.length = 0;
        options.xCells = parseInt(options.xCells);
        options.yCells = parseInt(options.yCells);

        //面板信息，cell的使用情况，映射模块的坐标和位置
        var panelUsage = {
            info: [],
            /**
             * 创建模块时获取初始可用位置,如果多个位置可用则只取第一个
             * @param xCells 新模块x方向单元块数
             * @param yCells 新模块y方向单元块数
             * @returns {*} 有位置则返回位置信息，没有则返回null
             */
            getInitPosition: function (xCells, yCells) {
                var self = this;

                //第一个模块则直接返回原点位置
                if (modules.length === 0) {
                    return self.info[0][0];
                }

                /**
                 * 检查从firstCell开始的单元块是否够模块使用
                 * @param firstCell
                 * @returns {boolean}
                 */
                function isValid(firstCell) {
                    //遍历firstCell开始，新模块大小范围内的单元块
                    for (var y = 0; y < yCells; y++) {
                        for (var x = 0; x < xCells; x++) {
                            if (self.info[firstCell.yIndex + y][firstCell.xIndex + x].useInfo.moduleId) {
                                return false;
                            }
                        }
                    }

                    return true;
                }

                var firstCell;
                //查询模块放左下角和右上角时y和x范围内的单元块
                for (var y = 0; y <= options.yCells - yCells; y++) {
                    for (var x = 0; x <= options.xCells - xCells; x++) {
                        var cell = this.info[y][x];

                        if (!cell.useInfo.moduleId) {
                            //如果发现单元块没有被使用，则当作模块的第一个单元块
                            firstCell = cell;

                            if (isValid(firstCell)) {
                                return firstCell;
                            }
                        }
                    }
                }

                return null;
            },
            /**
             * 等价交换（哈哈，暂时这么称呼），即交换区域的大小相等
             * @param sourceModule 被拖动的模块（源模块）
             * @param targetCell 被拖动模块将要放置的目标区域的首单元块
             * @returns {*}
             */
            baseMove: function (sourceModule, targetCell) {
                var self = this;
                var targetAreaModules = [];//保存目标区域内的完整模块
                targetAreaModules.length = 0;
                var x= 0;//x轴
                var y = 0;//y轴

                //判断目标区域的单元块是否是原区域内的单元块，即是不是相交块，如果是则返回相交块在目标区域对应索引的坐标
                function isIntersect(cell) {
                    for (var y = 0; y < sourceModule.yCells; y++) {
                        for (var x = 0; x < sourceModule.xCells; x++) {
                            var sCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];

                            if (cell.xIndex === sCell.xIndex && cell.yIndex === sCell.yIndex) {
                                return {
                                    xIndex: targetCell.xIndex + x,
                                    yIndex: targetCell.yIndex + y
                                };
                            }
                        }
                    }

                    return false;
                }

                //处理相交的情况
                //判断交换区域（原区域和目标区域）是否相交，如果相交则返回原模块相交处对应的目标区域中的坐标
                for (y = 0; y < sourceModule.yCells; y++) {
                    for (x = 0; x < sourceModule.xCells; x++) {
                        var tCell = panelUsage.info[targetCell.yIndex + y][targetCell.xIndex + x];
                        var result = isIntersect(tCell);

                        //判断相交处目标区域是否有模块，如果有则不能交换
                        if (result) {
                            var useInfo = panelUsage.info[result.yIndex][result.xIndex].useInfo;
                            if (useInfo.moduleId && useInfo.moduleId !== sourceModule.id) {
                                return false;
                            }
                        }
                    }
                }

                //处理不相交的情况，看目标区域内模块是否完整，不完整则不能交换
                for (y = 0; y < sourceModule.yCells; y++) {
                    for (x = 0; x < sourceModule.xCells; x++) {
                        //查看目标区域内的单元块使用情况
                        var cell = self.info[targetCell.yIndex + y][targetCell.xIndex + x];

                        //如果已经使用，且不是被原模块使用则继续处理（是原模块使用就不做处理）
                        if (cell.useInfo.moduleId &&
                            cell.useInfo.moduleId !== sourceModule.id) {
                            //不能交换则结束
                            if (!modules[cell.useInfo.moduleId].swap) {
                                return false;
                            }

                            //是不是模板的第一个单元块
                            if (cell.useInfo.xIndex === 0 && cell.useInfo.yIndex === 0) {
                                //完整性检查
                                var targetAreaModule = modules[cell.useInfo.moduleId];

                                if (targetAreaModule.xCells > (sourceModule.xCells - x) ||
                                    targetAreaModule.yCells > (sourceModule.yCells - y)) {
                                    return false;
                                }

                                //完整模块就保存起来，并记录区域中的相对坐标
                                targetAreaModules[targetAreaModule.id] = {
                                    module: targetAreaModule,
                                    relativeIndex: {
                                        x: x,
                                        y: y
                                    }
                                };
                                targetAreaModules.length += 1;
                            } else {
                                //不是模块第一块,查看是否是已经知晓的目标区域内的完整模块，如果是完整模块则继续判断下一个单元块
                                if (targetAreaModules[cell.useInfo.moduleId]) {
                                    continue;
                                }

                                //不满足前面条件的则肯定不完整（因为是顺序遍历的）
                                return false;
                            }
                        }
                    }
                }

                return targetAreaModules;
            },
            /**
             * 交换算法扩展，水平，垂直非等价（交换位置的区域大小可能不一样）交换
             * @param sourceModule 源模块
             * @param targetCell 目标区域首个单元块
             * @returns {*} 不可移动返回false；可移动返回目标区域所有完整快信息，和移动方向
             */
            lineMove: function (sourceModule, targetCell) {
                var moveInfo = {
                    modules: [],
                    xMove: 0,
                    yMove: 0
                };
                var targetAreaModules = [];
                targetAreaModules.length = 0;

                //检查移动区域内的模块是否都是完整的
                function checkFullModule(xMove, yMove) {
                    //移动区域第一个单元块
                    var start = targetCell;//移动方向是反向移动时，移动区域首个单元块就是目标区域第一个单元块

                    //移动方向是正向移动时，移动区域首个单元块就是原区域中右上角或左下角坐标上的单元块
                    if (xMove > 0) {
                        start = {
                            xIndex: sourceModule.xIndex + sourceModule.xCells,
                            yIndex: sourceModule.yIndex
                        }
                    } else if (yMove > 0) {
                        start = {
                            xIndex: sourceModule.xIndex,
                            yIndex: sourceModule.yIndex + sourceModule.yCells
                        }
                    }

                    //移动区域单元块数
                    var yCells = Math.abs(yMove);
                    var xCells = Math.abs(xMove);
                    if (xCells !== 0) {
                        yCells = sourceModule.yCells;
                    } else if (yCells !== 0) {
                        xCells = sourceModule.xCells;
                    }

                    //遍历移动区域
                    for (var y = 0; y < yCells; y++) {
                        for (var x = 0; x < xCells; x++) {
                            var cell = panelUsage.info[start.yIndex + y][start.xIndex + x];

                            //没有被使用则不管
                            if (!cell.useInfo.moduleId) {
                                continue;
                            }

                            //不能交换则结束
                            if (!modules[cell.useInfo.moduleId].swap) {
                                return false;
                            }

                            //是不是模板的第一个单元块
                            if (cell.useInfo.xIndex === 0 && cell.useInfo.yIndex === 0) {
                                //完整性
                                var targetAreaModule = modules[cell.useInfo.moduleId];

                                if (targetAreaModule.xCells > (xCells - x) ||
                                    targetAreaModule.yCells > (yCells - y)) {
                                    //不完整
                                    return false;
                                }

                                targetAreaModules[targetAreaModule.id] = targetAreaModule;
                                targetAreaModules.length += 1;
                            } else {
                                //如果不是第一个单元块，但完整块中已有该模块，则继续
                                if (targetAreaModules[cell.useInfo.moduleId]) {
                                    continue;
                                }

                                return false;
                            }
                        }
                    }

                    return true;
                }

                /**4种移动，判断目标区域内的模块是否是完整的，如果是完整
                 * 的则把目标区域内所有模块反向移动当前移动块移动的距离（根据方向来确定是x还是y）
                 * 并把移动块放下
                 */
                if (sourceModule.xIndex === targetCell.xIndex ||
                    sourceModule.yIndex === targetCell.yIndex) {
                    var yMove = targetCell.yIndex - sourceModule.yIndex;
                    var xMove = targetCell.xIndex - sourceModule.xIndex;

                    //移动方向1正向，-1反向，0未移动
                    moveInfo.xMove = xMove > 0 ? 1 : (xMove < 0 ? -1 : 0);
                    moveInfo.yMove = yMove > 0 ? 1 : (yMove < 0 ? -1 : 0);

                    if (checkFullModule(xMove, yMove)) {
                        moveInfo.modules = targetAreaModules;
                        return moveInfo;
                    } else {
                        return false;
                    }
                } else {
                    //不是水平或垂直移动，这里不处理
                    return false;
                }
            },
            /**
             * 获取离指定位置最近的单元块（距离是到单元块左上角）
             * @param point
             * @returns {*}
             */
            getNearestCell: function (point) {
                var nearCell = point;
                var minDistance = 9999999999;//默认最大值

                function countDistance(pointA, pointB) {
                    return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
                }

                for (var y = 0; y < options.yCells; y++) {
                    for (var x = 0; x < options.xCells; x++) {
                        var cell = this.info[y][x];
                        var distance = countDistance(point, cell);

                        if (distance < minDistance) {
                            minDistance = distance;
                            nearCell = cell;
                        }
                    }
                }

                return nearCell;
            },
            areaClean: function () {

            },
            areaUpdate: function () {

            },
            cleanModule: function (module) {
                for (var y = 0; y < module.yCells; y++) {
                    for (var x = 0; x < module.xCells; x++) {
                        var sourceCell = panelUsage.info[module.yIndex + y][module.xIndex + x];
                        sourceCell.clean();
                    }
                }
            },
            cleanAllModule: function () {
                for (var y = 0; y < options.yCells; y++) {
                    for (var x = 0; x < options.xCells; x++) {
                        var sourceCell = panelUsage.info[y][x];
                        sourceCell.clean();
                    }
                }
            },
            updateModule: function (module, target) {
                var x = 0;
                var y = 0;

                //需要先清空，在更新，否则同一块移动到之前的区域会有问题
                this.cleanModule(module);

                for (y = 0; y < module.yCells; y++) {
                    for (x = 0; x < module.xCells; x++) {
                        //新区域更新
                        var targetCell = panelUsage.info[target.yIndex + y][target.xIndex + x];
                        targetCell.useInfo.moduleId = module.id;
                        targetCell.useInfo.xIndex = x;
                        targetCell.useInfo.yIndex = y;
                    }
                }

                //模块信息更新
                module.x = target.x;
                module.y = target.y;
                module.xIndex = target.xIndex;
                module.yIndex = target.yIndex;
            },
            /**
             * 直线移动交换模块
             * @param sourceModule 源模块
             * @param moveInfo 目标区域模块集合和移动方向
             * @param targetCell 目标区域首单元块
             */
            lineSwapModule: function (sourceModule, moveInfo, targetCell) {
                //源模块区域重置
                this.cleanModule(sourceModule);

                function updateModule(module, position) {
                    for (var y = 0; y < module.yCells; y++) {
                        for (var x = 0; x < module.xCells; x++) {
                            var cell = panelUsage.info[position.yIndex + y][position.xIndex + x];

                            cell.useInfo.moduleId = module.id;
                            cell.useInfo.xIndex = x;
                            cell.useInfo.yIndex = y;
                        }
                    }
                }

                //更新目标区域
                updateModule(sourceModule, targetCell);

                var xMove = moveInfo.xMove * sourceModule.xCells;
                var yMove = moveInfo.yMove * sourceModule.yCells;
                for (var key in moveInfo.modules) {
                    var module = moveInfo.modules[key];
                    //相反方向移动
                    var cell = panelUsage.info[module.yIndex - yMove][module.xIndex - xMove];
                    var position = {
                        xIndex: cell.xIndex,
                        yIndex: cell.yIndex
                    };

                    //区域更新
                    updateModule(module, position);

                    //模块信息更新
                    module.x = cell.x;
                    module.y = cell.y;
                    module.xIndex = cell.xIndex;
                    module.yIndex = cell.yIndex;
                }

                //模块信息更新
                sourceModule.x = targetCell.x;
                sourceModule.y = targetCell.y;
                sourceModule.xIndex = targetCell.xIndex;
                sourceModule.yIndex = targetCell.yIndex;
            },
            /**
             * 等价交换模块
             * @param sourceModule 源模块
             * @param targetModules 目标区域模块集合
             * @param targetCell 目标区域首单元块
             */
            swapModule: function (sourceModule, targetModules, targetCell) {
                //源模块区域重置
                this.cleanModule(sourceModule);

                function updateModule(module, position) {
                    for (var y = 0; y < module.yCells; y++) {
                        for (var x = 0; x < module.xCells; x++) {
                            var cell = panelUsage.info[position.yIndex + y][position.xIndex + x];

                            cell.useInfo.moduleId = module.id;
                            cell.useInfo.xIndex = x;
                            cell.useInfo.yIndex = y;
                        }
                    }
                }

                //更新目标区域
                updateModule(sourceModule, targetCell);
                //更新源区域
                for (var key in targetModules) {
                    var targetModule = targetModules[key];
                    var position = {
                        xIndex: sourceModule.xIndex + targetModule.relativeIndex.x,
                        yIndex: sourceModule.yIndex + targetModule.relativeIndex.y
                    };

                    //区域更新
                    updateModule(targetModule.module, position);

                    //模块信息更新
                    var module = modules[key];
                    module.x = panelUsage.info[position.yIndex][position.xIndex].x;
                    module.y = panelUsage.info[position.yIndex][position.xIndex].y;
                    module.xIndex = position.xIndex;
                    module.yIndex = position.yIndex;
                }

                //模块信息更新
                sourceModule.x = targetCell.x;
                sourceModule.y = targetCell.y;
                sourceModule.xIndex = targetCell.xIndex;
                sourceModule.yIndex = targetCell.yIndex;
            },
            resizeModule: function (module, target, resizeInfo) {
                var x = 0;
                var y = 0;

                //需要先清空，在更新，否则同一块移动到之前的区域会有问题
                this.cleanModule(module);

                for (y = 0; y < resizeInfo.yCells; y++) {
                    for (x = 0; x < resizeInfo.xCells; x++) {
                        //新区域更新
                        var targetCell = panelUsage.info[target.yIndex + y][target.xIndex + x];
                        targetCell.useInfo.moduleId = module.id;
                        targetCell.useInfo.xIndex = x;
                        targetCell.useInfo.yIndex = y;
                    }
                }

                //模块信息更新
                module.xCells = resizeInfo.xCells;
                module.yCells = resizeInfo.yCells;
            }
        };

        function init() {
            position.y = $panel.offset().top;
            position.x = $panel.offset().left;

            width = $panel.width();
            height = $panel.height();
        }

        function initPanelInfo() {
            var axis = [];
            var cells = $panel.find('.cell');
            var counts = 0;

            //二维数组，每个一维元素表示一排；二维元素记录相对root的像素位置，模板的单元块坐标，和使用信息useInfo；useInfo中包含模块id以及模块的单元块坐标；
            for (var y = 0; y < options.yCells; y++) {
                var yAxis = [];
                for (var x = 0; x < options.xCells; x++) {
                    var position = $(cells[counts++]).position();
                    yAxis.push({
                        x: position.left,
                        y: position.top,
                        useInfo: {
                            moduleId: null,
                            xIndex: 0,
                            yIndex: 0
                        },
                        xIndex: x,
                        yIndex: y,
                        clean: function () {
                            this.useInfo.moduleId = null;
                            this.useInfo.xIndex = 0;
                            this.useInfo.yIndex = 0;
                        }
                    })
                }
                axis.push(yAxis)
            }

            panelUsage.info = axis;
        }

        function refreshPanelInfo() {
            var cells = $panel.find('.cell');
            var counts = 0;

            var oldPanelX = panelUsage.info[0].length;
            var oldPanelY = panelUsage.info.length;
            for (var y = 0; y < options.yCells; y++) {
                var yAxis = [];
                for (var x = 0; x < options.xCells; x++) {
                    var point = null;
                    if (y < oldPanelY && x < oldPanelX) {
                        point = panelUsage.info[y][x];
                    }
                    var position = $(cells[counts++]).position();

                    if (point) {
                        point.x = position.left;
                        point.y = position.top;
                    } else {
                        if (y < oldPanelY && x > oldPanelX) {
                            panelUsage.info[y].push({
                                x: position.left,
                                y: position.top,
                                useInfo: {
                                    moduleId: null,
                                    xIndex: 0,
                                    yIndex: 0
                                },
                                xIndex: x,
                                yIndex: y,
                                clean: function () {
                                    this.useInfo.moduleId = null;
                                    this.useInfo.xIndex = 0;
                                    this.useInfo.yIndex = 0;
                                }
                            });
                        } else {
                            yAxis.push({
                                x: position.left,
                                y: position.top,
                                useInfo: {
                                    moduleId: null,
                                    xIndex: 0,
                                    yIndex: 0
                                },
                                xIndex: x,
                                yIndex: y,
                                clean: function () {
                                    this.useInfo.moduleId = null;
                                    this.useInfo.xIndex = 0;
                                    this.useInfo.yIndex = 0;
                                }
                            });
                        }
                    }
                }

                if (yAxis.length > 0) {
                    panelUsage.info.push(yAxis);
                }
            }
        }
        // 拖动事件
        function onDragEvent() {
            var module = {
                clean: function () {
                    this.target = null;
                    this.x = 0;
                    this.y = 0;
                    this.width = 0;
                    this.height = 0;
                    this.clickX = 0;
                    this.clickY = 0;
                },
                showTipBox: function (position) {
                    var $module = $(this.target);
                    $panel.find('.tipBox').css({
                        width: $module.width(),
                        height: $module.height(),
                        top: position.y + 'px',
                        left: position.x + 'px'
                    }).addClass('second_top');
                },
                hideTipBox: function () {
                    $panel.find('.tipBox').removeClass('second_top');
                },
                startDrag: function (event) {
                    var $target = $(event.target).parents('.module').eq(0);
                    //判断是否可拖动
                    if ($target.attr('data-drag') !== 'true') {
                        return;
                    }

                    var position = $target.position();
                    var offset = $target.offset();
                    $target.addClass('drag');

                    this.target = $target;

                    //模块相对模板左上角的位置
                    this.x = position.left;
                    this.y = position.top;

                    //模块大小
                    this.width = $target.width();
                    this.height = $target.height();

                    //鼠标点击点相对模块左上角的距离
                    this.clickX = event.clientX - offset.left;
                    this.clickY = event.clientY - offset.top;
                },
                onDrag: function (event) {
                    if (!this.target) {
                        return;
                    }
                    //移动结束位置
                    var endX = event.clientX - this.clickX - position.x;
                    var endY = event.clientY - this.clickY - position.y;

                    //判断终点位置是否在模型上
                    if (endX + this.width > width) {
                        endX = width - this.width;
                    } else if (endX < 0) {
                        endX = 0;
                    }
                    if (endY + this.height > height) {
                        endY = height - this.height;
                    } else if (endY < 0) {
                        endY = 0;
                    }

                    this.x = endX;
                    this.y = endY;

                    /**
                     * 现在是所有情况都显示提示框，后续改进可以放置或可以置换的才显示
                     * （可以将判断信息保存起来，用于enddrag和避免目标区域相同时每次移动都要进行重复判断）
                     * 也可增加原位置提示
                     */
                    //获取最近的单元块,设置提示框
                    var nearCell = panelUsage.getNearestCell({
                        x: this.x,
                        y: this.y
                    });
                    this.showTipBox(nearCell);

                    //设置移动后的位置
                    $(this.target).css({
                        top: endY + 'px',
                        left: endX + 'px'
                    });
                },
                endDrag: function (event) {
                    var self = this;
                    if (!this.target) {
                        return;
                    }

                    var position = {
                        x: 0,
                        y: 0
                    };
                    //获取最近的单元块
                    var targetCell = panelUsage.getNearestCell({
                        x: this.x,
                        y: this.y
                    });

                    var moduleId = $(this.target).attr('data-id');
                    var sourceModule = modules[moduleId];

                    //如果既符合等价交换也符合直线移动交换，则首先处理等价交换
                    function changePosition() {
                        var key = null;

                        //位置是否有效（是否能够放下）,如果能放下且目标区域有完整的其它模块，则返回这些模块
                        var results = panelUsage.baseMove(sourceModule, targetCell);
                        if (results) {
                            //完整模块为0个，直接放
                            if (results.length === 0) {
                                panelUsage.updateModule(sourceModule, targetCell);
                                position.x = targetCell.x;
                                position.y = targetCell.y;
                            } else {
                                //多个完整模块，等位交换位置
                                panelUsage.swapModule(sourceModule, results, targetCell);

                                position.x = targetCell.x;
                                position.y = targetCell.y;

                                //遍历移动
                                for (key in results) {
                                    $panel.find('.module[data-id=' + key + ']').stop(true).animate({
                                        top: modules[key].y + 'px',
                                        left: modules[key].x + 'px'
                                    }, 200);
                                }
                            }
                        } else {
                            //查看是否是水平或直线移动
                            var moveInfo = panelUsage.lineMove(sourceModule, targetCell);
                            if (moveInfo) {
                                //进这儿了必然有数据，如果没数据，前面的算法已处理，不会到这个分支
                                position.x = targetCell.x;
                                position.y = targetCell.y;

                                //遍历移动
                                var xMove = moveInfo.xMove * sourceModule.xCells;
                                var yMove = moveInfo.yMove * sourceModule.yCells;
                                for (key in moveInfo.modules) {
                                    var module = moveInfo.modules[key];
                                    //相反方向移动
                                    var cell = panelUsage.info[module.yIndex - yMove][module.xIndex - xMove];

                                    $panel.find('.module[data-id=' + key + ']').stop(true).animate({
                                        top: cell.y + 'px',
                                        left: cell.x + 'px'
                                    }, 200);
                                }

                                //多个完整模块，直线交换位置
                                panelUsage.lineSwapModule(sourceModule, moveInfo, targetCell);
                            } else {
                                //还原
                                position.x = sourceModule.x;
                                position.y = sourceModule.y;
                            }
                        }
                    }

                    changePosition();

                    $(this.target).stop(true).animate({
                        top: position.y + 'px',
                        left: position.x + 'px'
                    }, 200, function () {
                        //保持拖动块在最终停止前都处于最上层
                        $panel.find('.module[data-id=' + moduleId + ']').removeClass('drag');

                        self.hideTipBox();
                    });

                    self.clean();
                },
                showModules: function() {
                    console.log('drag:');
                    console.log(modules);
                }
            };

            function onStartDrag(event) {
                module.startDrag(event);
            }

            function onDraging(event) {
                //module.showModules();
                module.onDrag(event);
            }

            function onEndDrag(event) {
                module.endDrag(event);
            }

            function off() {
                $panel.off('mousedown', '.module > .cover', onStartDrag);
                $(document).off('mousemove', onDraging);
                $(document).off('mouseup', onEndDrag);
            }

            off();

            $panel.on('mousedown', '.module > .cover', onStartDrag);
            $(document).on('mousemove', onDraging);
            $(document).on('mouseup', onEndDrag);

            return {
                off: off
            }
        }
        // 向下，右改变模块大小事件
        function onResizeEvent() {
            var module = {
                showTipBox: function () {
                    var position = this.$target.position();

                    $panel.find('.tipBox').css({
                        width: this.tempX * this.cell.width - 6,
                        height: this.tempY * this.cell.height - 6,
                        top: position.top,
                        left: position.left
                    }).addClass('second_top');
                },
                hideTipBox: function () {
                    $panel.find('.tipBox').removeClass('second_top');
                },
                startResize: function(event) {
                    var $target = $(event.target).parents('.module').eq(0);
                    //判断是否可拉伸
                    if ($target.attr('data-resize') !== 'true') {
                        return;
                    }

                    this.info = modules[$target.attr('data-id')];
                    this.$target = $target;

                    if ($(event.target).hasClass('horizontal_resize')) {
                        this.resizeType = 'horizontal';
                    } else if ($(event.target).hasClass('vertical_resize')) {
                        this.resizeType = 'vertical';
                    } else if ($(event.target).hasClass('both_resize')) {
                        this.resizeType = 'equalProportion';
                    } else {
                        return;
                    }

                    this.resize = true;

                    //模块相对模板左上角的位置
                    var position = $target.position();
                    this.x = position.left;
                    this.y = position.top;

                    //模块大小
                    this.width = $target.width();
                    this.height = $target.height();

                    //鼠标点击点
                    this.clickX = event.clientX;
                    this.clickY = event.clientY;

                    //
                    this.cell = {
                        width: width / options.xCells,
                        height: height / options.yCells
                    };
                },
                onResize: function(event) {
                    if(!this.resize) {
                        return;
                    }
                    var self = this;

	                /**
                     * 处理水平和垂直方向的拉伸
                     * @param params
                     *      cells 水平或垂直方向上单元块的个数
                     *      resizeLimits 对应方向上拉伸时限制的最大单元块个数
                     *      direction -1表示缩小，1表示放大，0表示不变
                     *      moveDistance 对应方向上的移动距离（像素）
                     *      singleDistance 单元块的高（垂直方向）或宽（水平方向）
                     * @returns {*|HTMLCollection} 拉伸处理后模块的单元块个数（对应方向上的）
                     * 备注：params中的参数必须一致，处理水平方向则全部传水平方向的相关参数，处理垂直方向则全部传垂直方向的距离
	                 */
                    function resizeModule(params) {
                        var i = 0;
                        var tempCells = params.cells;//水平或垂直方向上单元块的个数

                        function haveModule(addCells) {
                            var haveModule = false;
                            var startX = 0;
                            var startY = 0;
                            var endY = 0;
                            var endX = 0;

                            if (addCells <= 0) {
                                return haveModule;
                            }

                            if(params.type === 'horizontal') {
                                startY = self.info.yIndex;
                                endY = self.info.yIndex + self.info.yCells;
                                startX = self.info.xIndex + self.info.xCells;
                                endX = self.info.xIndex + self.info.xCells + addCells;
                            } else if (params.type = 'vertical') {
                                startY = self.info.yIndex + self.info.yCells;
                                endY = self.info.yIndex + self.info.yCells + addCells;
                                startX = self.info.xIndex;
                                endX = self.info.xIndex + self.info.xCells;
                            }

                            for(var y = startY; y < endY; y++) {
                                for(var x = startX; x < endX; x++) {
                                    //如果鼠标拉伸位置大于了面板的位置则当做有模板处理
                                    if(x >= options.xCells || y >= options.yCells ||
                                        panelUsage.info[y][x].useInfo.moduleId) {
                                        haveModule = true;
                                        break;
                                    }
                                }
                            }

                            return haveModule;
                        }

                        //某方向上的单元块个数是否小于等于该方向上的拉伸限制个数
                        if (params.cells <= params.resizeLimits ) {
                            if (params.direction > 0) {
                                //根据移动距离，算出拉长了几个单元格
                                for (i = 0; i <= params.resizeLimits - params.cells; i++) {
                                    //判断当前位置是否有模块
                                    if(haveModule(i)) {
                                        i -= 1;
                                        break;
                                    }

                                    if (params.moveDistance > i * params.singleDistance) {
                                        continue;
                                    } else {
                                        break;
                                    }
                                }
                            } else if (params.direction < 0) {
                                //根据移动距离，算出放缩了几个单元格
                                for (i = 1; i <= params.cells; i++) {
                                    if (params.moveDistance > i * params.singleDistance) {
                                        continue;
                                    } else {
                                        break;
                                    }
                                }

                                i -= 1;
                            }
                        } else {
                            //如果单元块数大于拉伸限制个数，则不能被拉长
                            if (params.direction < 0) {
                                for (i = 1; i < params.cells; i++) {
                                    if (params.moveDistance > i * params.singleDistance) {
                                        continue;
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }

                        tempCells += i * params.direction;

                        //结果校正，最小为一个单元格，最大为拉伸限制个数
                        if(tempCells < 1) {
                            tempCells = 1;
                        } else if (tempCells > params.resizeLimits) {
                            tempCells = params.resizeLimits;
                        }

                        return tempCells;
                    }

                    //获取鼠标移动距离
                    var moveX = event.clientX - this.clickX;
                    var moveY = event.clientY - this.clickY;
                    var hDirection = moveX > 0 ? 1 : (moveX < 0 ? - 1 : 0);//1表示right,-1表示left,0表示不变
                    var vDirection = moveY > 0 ? 1 : (moveY < 0 ? -1 : 0);//1表示bottom,-1表示top,0表示不变
                    var absMoveX = Math.abs(moveX);
                    var absMoveY = Math.abs(moveY);
                    var tempWidth = this.width;
                    var tempHeight = this.height;

                    this.tempX = this.info.xCells;
                    this.tempY = this.info.yCells;
                    //水平方向
                    if (this.resizeType === 'equalProportion' || this.resizeType === 'horizontal') {
                        this.tempX = resizeModule({
                            type: 'horizontal',
                            cells: this.info.xCells,
                            resizeLimits: options.resizeX,
                            direction: hDirection,
                            moveDistance: absMoveX,
                            singleDistance: this.cell.width
                        });

                        tempWidth = this.width + moveX;
                    }
                    //垂直方向
                    if (this.resizeType === 'equalProportion' || this.resizeType === 'vertical') {
                        this.tempY = resizeModule({
                            type: 'vertical',
                            cells: this.info.yCells,
                            resizeLimits: options.resizeY,
                            direction: vDirection,
                            moveDistance: absMoveY,
                            singleDistance: this.cell.height
                        });

                        tempHeight = this.height + moveY;
                    }

                    this.$target.css({
                        width: tempWidth < 0 ? 0 : tempWidth,
                        height: tempHeight < 0 ? 0 : tempHeight
                    });

                    this.showTipBox();
                },
                endResize: function(event) {
                    if(!this.resize) {
                        return;
                    }
                    this.resize = false;

                    //根据结果动画拉伸
                    this.hideTipBox();

                    panelUsage.resizeModule(this.info, panelUsage.info[this.info.yIndex][this.info.xIndex], {
                        xCells: this.tempX,
                        yCells: this.tempY
                    });

                    this.$target.animate({
                        width: this.tempX * this.cell.width - 6,
                        height: this.tempY * this.cell.height - 6
                    }, 200);
                }
            };

            function onStartResize(event) {
                module.startResize(event);
            }

            function onResizing(event) {
                //module.showModules();
                module.onResize(event);
            }

            function onEndResize(event) {
                module.endResize(event);
            }

            function off() {
                $panel.off('mousedown',
                    '.module > .horizontal_resize,' +
                    '.module > .vertical_resize,' +
                    '.module > .both_resize', onStartResize);

                $(document).off('mousemove', onResizing);
                $(document).off('mouseup', onEndResize);
            }

            off();

            $panel.on('mousedown',
                '.module > .horizontal_resize,' +
                '.module > .vertical_resize,' +
                '.module > .both_resize', onStartResize);
            $(document).on('mousemove', onResizing);
            $(document).on('mouseup', onEndResize);


            return {
                off: off
            }
        }
        // render  cell 格子
        function renderCell() {
            var cells = options.xCells * options.yCells;
            var html = '';

            for (var i = 0; i < cells; i++) {
                html += '<div class="cell"></div>';
            }

            $panel.append(html);

            $panel.find('.cell').css({
                width: width / options.xCells - 6,
                height: height / options.yCells - 6
            });
        }
        // 添加一个提示框，拖动后放置的位置
        function renderTipBox() {
            $panel.append('<div class="tipBox second_top"></div>');
        }
        // render 单个模块
        function renderModule(module) {
            $panel.append('<div class="module" ondragstart="return false" ondrag="return false" data-show="'+ module.show +'" data-id="' + module.id + '">' +
                '<span class="oper_module_btn edit_btn" ondragstart="return false" ondrag="return false">编辑</span>' +
                '<span class="oper_module_btn delete_btn" ondragstart="return false" ondrag="return false">关闭</span>' +
                '<iframe src="' + module.url + '"></iframe>' +
                '</div>');

            var userAttr = {
                'data-drag': module.drag ? 'true' : 'false',
                'data-swap': module.swap ? 'true' : 'false',
                'data-resize': module.resize ? 'true' : 'false'
            };

            //var position = panelUsage.info[module.yIndex][module.xIndex];
            //-6是border，为了展示块之间的间隔效果
            var $model = $('.module[data-id=' + module.id + ']');
            $model.css({
                width: width / options.xCells * module.xCells - 6,
                height: height / options.yCells * module.yCells - 6,
                top: height / options.yCells * module.yIndex,
                left: width / options.xCells * module.xIndex
            }).attr(userAttr);

            if(userAttr['data-drag'] === 'true'){
                $model.append('<span class="cover"></span>');
            }

            //如果属性是可拉伸
            if(userAttr['data-resize'] === 'true') {
                $model.append('<div class="horizontal_resize"></div>' +
                '<div class="vertical_resize"></div>' +
                '<div class="both_resize"></div>')
            }

            //
            $model.find('iframe').eq(0).css({
                width: '100%',
                height: '100%'
            });

            $model.find('.delete_btn').eq(0).on('click', function (event) {
                var index = $(this).parents('.module').eq(0).attr('data-id');
                deleteMoudle(index);
            });
        }
        // 渲染多个模块
        function renderModules() {
            //遍历modules，根据位置设置
            if (modules.length === 0) {
                return;
            }

            for (var key in modules) {
                renderModule(modules[key]);
            }
        }
        // 根据id删除模块
        function deleteMoudle(id) {
            $('.module[data-id=' + id + ']').remove();
            panelUsage.cleanModule(modules[id]);

            delete modules[id];
            modules.length -= 1;
        }

        /**
         * 校正useInfo信息
         */
        function regulateUseInfo() {
            for (var key in modules) {
                var module = modules[key];
                panelUsage.updateModule(module, panelUsage.info[module.yIndex][module.xIndex]);
            }
        }

        this.render = function() {
            init();

            $panel.empty();
            renderCell();
            if (modules.length === 0 || panelUsage.info.length === 0) {
                initPanelInfo();
            } else {
                refreshPanelInfo();
            }

            renderTipBox();
            renderModules();

            if(templateEvent) {
                templateEvent.off();
            }
            templateEvent = onDragEvent();

            if (panelResizeEvent) {
                panelResizeEvent.off();
            }
            panelResizeEvent = onResizeEvent();

            $('.wrap_con').scroll(function(e){
                init();
            })


        };

        this.refresh = function (xCells, yCells) {
            setRate(xCells, yCells);
            this.render();
        };

        function setRate(x, y) {
            options.xCells = x;
            options.yCells = y;
        }

        this.createMoudle = function (params) {
            var position = {
                x: 0,
                y: 0,
                xIndex: 0,
                yIndex: 0
            };

            if (params.xCells > options.xCells || params.yCells > options.yCells) {
                return -1;
            }
            params.xCells = parseInt(params.xCells);
            params.yCells = parseInt(params.yCells);

            if (modules.length !== 0) {
                //根据大小计算放置位置，如果没有合适位置则提示
                position = panelUsage.getInitPosition(params.xCells, params.yCells);
                if (!position) {
                    return 0;
                }
            }

            var moduleId = 'module' + moduleIndex;
            var module = {
                id: moduleId,
                name: params.name,
                url: params.url,
                xCells: params.xCells,
                yCells: params.yCells,
                drag: params.drag,
                swap: params.swap,
                resize: params.resize,
                show: params.show,
                x: position.x,
                y: position.y,
                xIndex: position.xIndex,
                yIndex: position.yIndex
            };

            panelUsage.updateModule(module, panelUsage.info[position.yIndex][position.xIndex]);
            modules[module.id] = module;
            modules.length += 1;

            renderModule(module);
            moduleIndex++;

            return true;
        };

        this.clean = function () {
            $panel.find('.module').remove();
            panelUsage.cleanAllModule();

            modules = [];
            modules.length = 0;
        };

        this.save = function () {
            //转换成后台需要的结构，然后ajax上传
            var template = {
                name: options.name,
                xCells: options.xCells,
                yCells: options.yCells,
                modules: []
            };

            for (var key in modules) {
                template.modules.push(modules[key]);
            }

            //存在则更新
            /*for (var i = 0; i < templates.length; i++) {
                if (templates[i].name === options.name) {
                    templates[i] = template;
                    return true;
                }
            }*/

            //新加
            /*templates.push(template);*/
            return template;
        };

        this.delete = function () {
            this.clean();
            $panel.empty();

            if(templateEvent) {
                templateEvent.off();
            }
            if (panelResizeEvent) {
                panelResizeEvent.off();
            }
        };

        /**
         * 展示指定模板
         * @param name
         * @returns {*}
         */
        this.show = function (name) {
            modules = [];
            modules.length = 0;
            panelUsage.info = [];

            //纯展示
            for (var i = 0; i < templates.length; i++) {
                var template = templates[i];
                if (template.name === name) {
                    options.name = template.name;
                    options.xCells = template.xCells;
                    options.yCells = template.yCells;
                    for (var j = 0; j < template.modules.length; j++) {
                        modules.length += 1;
                        modules[template.modules[j].id] = template.modules[j];
                    }

                    init();
                    $panel.empty();
                    renderModules();

                    if(templateEvent) {
                        templateEvent.off();
                    }
                    if (panelResizeEvent) {
                        panelResizeEvent.off();
                    }
                    return template;
                }
            }

            return false;
        };

        /**
         * 编辑指定名称的模板
         * @param name
         * @returns {*}
         */
        this.edit = function (name) {
            var module;
            modules = [];
            modules.length = 0;
            panelUsage.info = [];

            for (var i = 0; i < templates.length; i++) {
                var template = templates[i];
                if (template.name === name) {
                    options.name = template.name;
                    options.xCells = template.xCells;
                    options.yCells = template.yCells;
                    for (var j = 0; j < template.modules.length; j++) {
                        module = template.modules[j];
                        modules.length += 1;
                        modules[module.id] = module;

                        //moduleIndex
	                    var index = parseInt(module.id.split('module')[1])
                        if(moduleIndex < index) {
                            moduleIndex = index;
                        }
                    }
                    moduleIndex += 1;

                    this.render();

                    //处理panelUseInfo
                    regulateUseInfo();

                    return template;
                }
            }

            return false;
        };
    }



    global.PanelTemplate = global.PanelTemplate || PanelTemplate;

})(window, jQuery);