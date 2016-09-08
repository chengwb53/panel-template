/**
 * Created by chengwb on 2016/9/5.
 * demo 功能待扩充，待添加对象深拷贝方法，返回拷贝的数据
 */
(function (global, $, undefined) {
	'use strict';

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
			}
		};
		var options = $.extend(defaults, options);
		var $panel = $(root);
		var $_panel = $panel.clone();
		var width = 1200;
		var height = 900;
		var position = {};
		var modules = {};
		var moduleIndex = 0;
		var self = this;

		modules.length = 0;
		options.xCells = parseInt(options.xCells);
		options.yCells = parseInt(options.yCells);

		//面板信息，cell的使用情况，映射模块的位置
		var panelUsage = {
			info: [],
			getValidPosition: function (xCells, yCells) {
				var self = this;
				//返回可用位置,如果一种有多个位置可用则只取第一个
				var position = {
					x: 0,
					y: 0
				};

				if (modules.length === 0) {
					return position;
				}

				function isValid(firstCell) {
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
				for (var y = 0; y <= options.yCells - yCells; y++) {
					for (var x = 0; x <= options.xCells - xCells; x++) {
						var cell = this.info[y][x];
						if (!cell.useInfo.moduleId) {
							firstCell = cell;

							if (isValid(firstCell)) {
								return firstCell;
							}
						}
					}
				}

				return null;
			},
			isValidPosition: function (sourceModule, targetCell) {
				var self = this;
				var targetAreaModules = [];
				var intersects = [];
				targetAreaModules.length = 0;

				//判断是否相交，如果相交判断目标区域相同位置是否有模块
				function isIntersect(cell) {
					//源模块四个角的cell索引坐标
					//var points = [];
					//points.push({xIndex: sourceModule.xIndex, yIndex: sourceModule.yIndex});
					//points.push({xIndex: sourceModule.xIndex + sourceModule.xCells, yIndex: sourceModule.yIndex});
					//points.push({xIndex: sourceModule.xIndex, yIndex: sourceModule.yIndex + sourceModule.yCells});
					//points.push({xIndex: points[1].xIndex, yIndex: points[2].yIndex});
					//
					////目标区域
					//var startXIndex = targetCell.xIndex;
					//var endXIndex = targetCell.xIndex + sourceModule.xCells;
					//var startYIndex = targetCell.yIndex;
					//var endYIndex = targetCell.yIndex + sourceModule.yCells;
					//
					//for(var i = 0; i < points.length; i++) {
					//	var point = points[i];
					//
					//	if (point.xIndex >= startXIndex && point.xIndex <= endXIndex &&
					//		point.yIndex >= startYIndex && point.yIndex <= endYIndex) {
					//		return true;
					//	}
					//}
					//
					//return false;

					for(var y = 0; y < sourceModule.yCells; y++) {
						for(var x = 0; x < sourceModule.xCells; x++) {
							var sCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];
							if(cell.xIndex === sCell.xIndex && cell.yIndex === sCell.yIndex) {
								return {
									xIndex: targetCell.xIndex + x,
									yIndex: targetCell.yIndex + y
								};
							}
						}
					}

					return false;
				}
				//intersects = isIntersect();
				////待处理，获取具体相交的位置，判断目标区域该位置是否有模块
				//if(intersects) {
				//	return false;
				//}

				//判断是否是：在相交处源模块位置对应到目标模块的相应位置上
				for(var y = 0; y < sourceModule.yCells; y++) {
					for(var x = 0; x < sourceModule.xCells; x++) {
						var tCell = panelUsage.info[targetCell.yIndex + y][targetCell.xIndex + x];
						var result = isIntersect(tCell);
						if(result){
							var useInfo = panelUsage.info[result.yIndex][result.xIndex].useInfo;
							if(useInfo.moduleId && useInfo.moduleId !== sourceModule.id) {
								return false;
							}
						}
					}
				}

				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var cell = self.info[targetCell.yIndex + y][targetCell.xIndex + x];

						//如果是自己则忽略，不是自己则继续判断
						if (cell.useInfo.moduleId && cell.useInfo.moduleId !== sourceModule.id) {
							//是不是模板的第一个单元块
							if(cell.useInfo.xIndex === 0 && cell.useInfo.yIndex === 0) {
								//完整性
								var targetAreaModule = modules[cell.useInfo.moduleId];

								if(targetAreaModule.xCells > (sourceModule.xCells - x) ||
									targetAreaModule.yCells > (sourceModule.yCells - y)) {
									return false;
								}

								targetAreaModules[targetAreaModule.id] = {
									module:targetAreaModule,
									relativeIndex: {
										x: x,
										y: y
									}
								};
								targetAreaModules.length += 1;
							} else {
								if(targetAreaModules[cell.useInfo.moduleId]){
									continue;
								}

								return false;
							}
						}
					}
				}

				return targetAreaModules;
			},
			getNearestCell: function (point) {
				var nearCell = point;
				var minDistance = 99999999;

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
				//需要先清空，在更新，否则同一块移动到之前的区域会有问题
				for (var y = 0; y < module.yCells; y++) {
					for (var x = 0; x < module.xCells; x++) {
						//原模块区域重置
						var sourceCell = panelUsage.info[module.yIndex + y][module.xIndex + x];
						sourceCell.clean();
					}
				}

				for (var y = 0; y < module.yCells; y++) {
					for (var x = 0; x < module.xCells; x++) {
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
			swapModule: function (sourceModule, targetModules, targetCell) {
				//源模块区域重置
				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var sourceCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];
						sourceCell.clean();
					}
				}

				function updateModel(module, position) {
					for(var y = 0; y < module.yCells; y++) {
						for(var x = 0; x < module.xCells; x++) {
							var cell = panelUsage.info[position.yIndex + y][position.xIndex + x];

							cell.useInfo.moduleId = module.id;
							cell.useInfo.xIndex = x;
							cell.useInfo.yIndex = y;
						}
					}
				}

				//更新目标区域
				updateModel(sourceModule, targetCell);
				//更新源区域
				for(var key in targetModules) {
					var targetModule = targetModules[key];
					var position = {
						xIndex: sourceModule.xIndex + targetModule.relativeIndex.x,
						yIndex: sourceModule.yIndex + targetModule.relativeIndex.y
					};

					//区域更新
					updateModel(targetModule.module, position);

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
			console.log(axis);
		}

		function onEvent() {
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
					var $target = $(event.target);
					//判断是否可拖动
					if ($target.attr('data-drag') !== 'true') {
						return;
					}

					var position = $target.position();
					var offset = $target.offset();
					$target.addClass('drag');

					this.target = event.target;

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

					function changePosition() {
						//位置是否有效（是否能够放下）,如果能放下且目标区域有完整的其它模块，则返回这些模块
						var results = panelUsage.isValidPosition(sourceModule, targetCell);
						if (results) {
							//完整模块为0个，直接放
							if(results.length === 0) {
								panelUsage.updateModule(sourceModule, targetCell);
								position.x = targetCell.x;
								position.y = targetCell.y;
							}else{
								//多个完整模块，等位交换位置
								panelUsage.swapModule(sourceModule, results, targetCell);

								position.x = targetCell.x;
								position.y = targetCell.y;

								//遍历移动
								for(var key in results) {
									$panel.find('.module[data-id=' + key + ']').stop(true).animate({
										top: modules[key].y + 'px',
										left: modules[key].x + 'px'
									}, 200);
								}
							}
						} else {
							//还原
							position.x = sourceModule.x;
							position.y = sourceModule.y;
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

						console.log(panelUsage.info);
						console.log(modules);
					});

					self.clean();
				}
			};

			$panel.on('mousedown', '.module', function (event) {
				module.startDrag(event);
			});

			$(document).on('mousemove', function (event) {
				module.onDrag(event);
			});

			$(document).on('mouseup', function (event) {
				module.endDrag(event);
			});
		}

		function render() {
			renderCell();
			renderTipBox();
			renderModules();
		}

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

		function renderTipBox() {
			$panel.append('<div class="tipBox second_top"></div>');
		}

		function renderModule(module) {
			$panel.append('<div class="module" ondragstart="return false" ondrag="return false" data-id="' + module.id + '">' +
				'<span class="delete_btn" ondragstart="return false" ondrag="return false">x</span></div>');

			//-6是border，为了展示块之间的间隔效果
			$('.module[data-id=' + module.id + ']').css({
				width: module.width - 6,
				height: module.height - 6,
				top: module.y,
				left: module.x
			}).attr({
				'data-drag': module.drag ? 'true' : 'false',
				'data-swap': module.swap ? 'true' : 'false'
			});
		}

		function renderModules() {
			//遍历modules，根据位置设置
			//renderModule();
		}

		this.refresh = function () {
			render();
		};

		this.setRate = function (x, y) {
			options.xCells = x;
			options.yCells = y;
			//重新计算，绘图
		};

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
				position = panelUsage.getValidPosition(params.xCells, params.yCells);
				console.log(position);
				if (!position) {
					return 0;
				}
			}

			var moduleId = 'module' + moduleIndex;
			var module = {
				id: moduleId,
				xCells: params.xCells,
				yCells: params.yCells,
				width: width / options.xCells * params.xCells,
				height: height / options.yCells * params.yCells,
				drag: params.drag,
				swap: params.swap,
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

		this.deleteMoudle = function (id) {
			$('.module[data-id=' + id + ']').remove();
			panelUsage.cleanModule(modules[id]);

			delete modules[id];
			modules.length -= 1;
		};

		this.clean = function () {
			$panel.find('.module').remove();
			panelUsage.cleanAllModule();

			modules = {};
			modules.length = 0;
		};

		this.save = function () {
			//转换成后台需要的结构，然后ajax上传
		};

		this.delete = function () {
			this.clean();
			$panel.empty();
		};

		$panel.on('click', '.delete_btn', function (event) {
			var index = $(this).parents('.module').eq(0).attr('data-id');
			self.deleteMoudle(index);
		});

		init();
		render();
		initPanelInfo();
		onEvent();
	}

	global.PanelTemplate = global.PanelTemplate || PanelTemplate;

})(window, jQuery);