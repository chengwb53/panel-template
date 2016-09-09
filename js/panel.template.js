/**
 * Created by chengwb on 2016/9/5.
 * demo 功能待扩充，待添加对象深拷贝方法，返回拷贝的数据
 */
(function (global, $, undefined) {
	'use strict';

	function PanelTemplate(root, options) {
		var templates = [];//暂时保存模板，以名字为id
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
		var modules = [];
		var moduleIndex = 0;
		var self = this;
		var templateEvent;

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
			lineMove: function (sourceModule, targetCell) {
				var moveInfo = {
					modules: [],
					xMove: 0,
					yMove: 0
				};
				var targetAreaModules = [];
				targetAreaModules.length = 0;

				//所有完整
				function checkFullModule(xMove, yMove) {
					var start = targetCell;//移动小于0时
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

					var yCells = Math.abs(yMove);
					var xCells = Math.abs(xMove);
					if (xCells !== 0) {
						yCells = sourceModule.yCells;
					} else if (yCells !== 0) {
						xCells = sourceModule.xCells;
					}

					for (var y = 0; y < yCells; y++) {
						for (var x = 0; x < xCells; x++) {
							var cell = panelUsage.info[start.yIndex + y][start.xIndex + x];

							if (!cell.useInfo.moduleId) {
								continue;
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

				/**4种移动，判断移动区域内的模块是否是完整的，如果是完整
				 * 的则把移动区域内所有模块反向移动当前移动块的大小（根据方向来确定是x还是y）
				 * 并把移动块放下
				 */
				if (sourceModule.xIndex === targetCell.xIndex ||
					sourceModule.yIndex === targetCell.yIndex) {
					var yMove = targetCell.yIndex - sourceModule.yIndex;
					var xMove = targetCell.xIndex - sourceModule.xIndex;
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
			isValidPosition: function (sourceModule, targetCell) {
				var self = this;
				var targetAreaModules = [];
				targetAreaModules.length = 0;

				//判断是否相交，如果相交则返回目标区域对应索引坐标
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

				//判断是否是：在相交处源模块位置对应到目标模块的相应位置上
				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var tCell = panelUsage.info[targetCell.yIndex + y][targetCell.xIndex + x];
						var result = isIntersect(tCell);
						if (result) {
							var useInfo = panelUsage.info[result.yIndex][result.xIndex].useInfo;
							if (useInfo.moduleId && useInfo.moduleId !== sourceModule.id) {
								return false;
							}
						}
					}
				}

				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var cell = self.info[targetCell.yIndex + y][targetCell.xIndex + x];

						//如果是自己则忽略，不是自己则继续判断
						if (cell.useInfo.moduleId &&
							cell.useInfo.moduleId !== sourceModule.id) {
							//不能交换则结束
							if (!modules[cell.useInfo.moduleId].swap) {
								return false;
							}

							//是不是模板的第一个单元块
							if (cell.useInfo.xIndex === 0 && cell.useInfo.yIndex === 0) {
								//完整性
								var targetAreaModule = modules[cell.useInfo.moduleId];

								if (targetAreaModule.xCells > (sourceModule.xCells - x) ||
									targetAreaModule.yCells > (sourceModule.yCells - y)) {
									return false;
								}

								targetAreaModules[targetAreaModule.id] = {
									module: targetAreaModule,
									relativeIndex: {
										x: x,
										y: y
									}
								};
								targetAreaModules.length += 1;
							} else {
								if (targetAreaModules[cell.useInfo.moduleId]) {
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
			lineSwapModule: function(sourceModule, moveInfo, targetCell) {
				//源模块区域重置
				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var sourceCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];
						sourceCell.clean();
					}
				}

				function updateModel(module, position) {
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
				updateModel(sourceModule, targetCell);

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
					updateModel(module, position);

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
			swapModule: function (sourceModule, targetModules, targetCell) {
				//源模块区域重置
				for (var y = 0; y < sourceModule.yCells; y++) {
					for (var x = 0; x < sourceModule.xCells; x++) {
						var sourceCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];
						sourceCell.clean();
					}
				}

				function updateModel(module, position) {
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
				updateModel(sourceModule, targetCell);
				//更新源区域
				for (var key in targetModules) {
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

					function changePosition() {
						//位置是否有效（是否能够放下）,如果能放下且目标区域有完整的其它模块，则返回这些模块
						var results = panelUsage.isValidPosition(sourceModule, targetCell);
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
								for (var key in results) {
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
								for (var key in moveInfo.modules) {
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

						console.log(panelUsage.info);
						console.log(modules);
					});

					self.clean();
				}
			};

			function onStartDrag(event) {
				module.startDrag(event);
			}

			function onDraging(event) {
				module.onDrag(event);
			}

			function onEndDrag(event) {
				module.endDrag(event);
			};

			$panel.on('mousedown', '.module > .cover', onStartDrag);
			$(document).on('mousemove', onDraging);
			$(document).on('mouseup', onEndDrag);

			return {
				off: function () {
					$panel.off('mousedown', '.module > .cover', onStartDrag);
					$(document).off('mousemove', onDraging);
					$(document).off('mouseup', onEndDrag);
				}
			}
		}

		function render() {
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
				'<span class="delete_btn" ondragstart="return false" ondrag="return false">x</span>' +
				'<iframe src="' + module.url + '"></iframe>' +
				'<span class="cover"></span>' +
				'</div>');

			//var position = panelUsage.info[module.yIndex][module.xIndex];
			//-6是border，为了展示块之间的间隔效果
			$('.module[data-id=' + module.id + ']').css({
				width: width / options.xCells * module.xCells - 6,
				height: height / options.yCells * module.yCells - 6,
				top: height / options.yCells * module.yIndex,
				left: width / options.xCells * module.xIndex
			}).attr({
				'data-drag': module.drag ? 'true' : 'false',
				'data-swap': module.swap ? 'true' : 'false'
			});

			//
			$('.module[data-id=' + module.id + '] > iframe').css({
				width: width / options.xCells * module.xCells - 6,
				height: height / options.yCells * module.yCells - 6,
				top: height / options.yCells * module.yIndex,
				left: width / options.xCells * module.xIndex
			});

			console.log(panelUsage.info);
			console.log(modules);
		}

		function renderModules() {
			//遍历modules，根据位置设置
			if (modules.length === 0) {
				return;
			}

			for (var key in modules) {
				renderModule(modules[key]);
			}
		}

		/**
		 * 校正useInfo信息
		 */
		function regulateUseInfo() {
			for(var key in modules) {
				var module = modules[key];
				panelUsage.updateModule(module, panelUsage.info[module.yIndex][module.xIndex]);
			}
		}

		this.refresh = function (xCells, yCells) {
			setRate(xCells, yCells);
			render();
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
				position = panelUsage.getValidPosition(params.xCells, params.yCells);
				console.log(position);
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

			for(var key in modules) {
				template.modules.push(modules[key]);
			}

			//存在则更新
			for(var i = 0; i < templates.length; i++) {
				if(templates[i].name === options.name) {
					templates[i] = template;
					return;
				}
			}

			//新加
			templates.push(template);
		};

		this.delete = function () {
			this.clean();
			$panel.empty();

			templateEvent.off();
		};

		this.show = function(name) {
			modules = [];
			modules.length = 0;
			panelUsage.info = [];

			//纯展示
			for(var i = 0; i < templates.length; i++) {
				var template = templates[i];
				if(template.name === name) {
					options.name = template.name;
					options.xCells = template.xCells;
					options.yCells = template.yCells;
					for(var j = 0; j < template.modules.length; j++){
						modules.length += 1;
						modules[template.modules[j].id] = template.modules[j];
					}

					init();
					$panel.empty();
					renderModules();

					templateEvent.off();
					return template;
				}
			}

			return false;
		};

		this.edit = function(name) {
			modules = [];
			modules.length = 0;
			panelUsage.info = [];

			for(var i = 0; i < templates.length; i++) {
				var template = templates[i];
				if(template.name === name) {
					options.name = template.name;
					options.xCells = template.xCells;
					options.yCells = template.yCells;
					for(var j = 0; j < template.modules.length; j++){
						modules.length += 1;
						modules[template.modules[j].id] = template.modules[j];
					}

					templateEvent.off();
					templateEvent = onEvent();
					render();

					//处理panelUseInfo
					regulateUseInfo();

					return template;
				}
			}

			return false;
		};

		$panel.on('click', '.delete_btn', function (event) {
			var index = $(this).parents('.module').eq(0).attr('data-id');
			self.deleteMoudle(index);
		});

		render();

		templateEvent = onEvent();
	}

	global.PanelTemplate = global.PanelTemplate || PanelTemplate;

})(window, jQuery);