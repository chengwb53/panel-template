/**
 * Created by chengwb on 2016/9/5.
 * demo 功能待扩充
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
		var modules = [];
		var moduleIndex = 0;
		var self = this;

		//面板信息，cell的使用情况，映射模块的位置
		var panelUsage = {
			info: [],
			getValidModuleRate: function() {
				//返回所有可用比例,如果一种比例有多个位置可用则只取第一个
				var moduleRate = [];



				return moduleRate;
			},
			getNearestCell: function(point) {
				var nearCell = point;
				var minDistance = 99999999;

				function countDistance(pointA, pointB) {
					return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
				}

				for(var y = 0; y < this.info.length; y++) {
					var yAxis = this.info[y];

					for(var x = 0; x < yAxis.length; x++) {
						var cell = yAxis[x];
						var distance = countDistance(point, cell);

						if(distance < minDistance) {
							minDistance = distance;
							nearCell = cell;
						}
					}
				}

				return nearCell;
			},
			areaClean: function() {

			},
			areaUpdate: function() {

			},
			updateModule: function(module, target) {
				//需要先清空，在更新，否则同一块移动到之前的区域会有问题
				for(var y = 0; y < module.yCells; y++) {
					for(var x = 0; x < module.xCells; x++) {
						//原模块区域重置
						var sourceCell = panelUsage.info[module.yIndex + y][module.xIndex + x];
						//sourceCell.clean();
						sourceCell.useInfo.moduleId = null;
						sourceCell.useInfo.xIndex = 0;
						sourceCell.useInfo.yIndex = 0;
					}
				}

				for(var y = 0; y < module.yCells; y++) {
					for(var x = 0; x < module.xCells; x++) {
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
			swapModule: function(sourceModule, targetModule) {
				var xCells = sourceModule.xCells >= targetModule.xCells ? sourceModule.xCells : targetModule.xCells;
				var yCells = sourceModule.yCells >= targetModule.yCells ? sourceModule.yCells : targetModule.yCells;

				for(var y = 0; y < yCells; y++) {
					for(var x = 0; x < xCells; x++) {
						//待处理
						if(sourceModule.yIndex + y < sourceModule.yCells && sourceModule.xIndex + x < sourceModule.xCells) {
							//原区域
							var sourceCell = panelUsage.info[sourceModule.yIndex + y][sourceModule.xIndex + x];
							if (x >= targetModule.xCells || y >= targetModule.yCells) {
								//sourceCell.clean();
								sourceCell.useInfo.moduleId = null;
								sourceCell.useInfo.xIndex = 0;
								sourceCell.useInfo.yIndex = 0;
							} else {
								sourceCell.useInfo.moduleId = targetModule.id;
								sourceCell.useInfo.xIndex = x;
								sourceCell.useInfo.yIndex = y;
							}
						}

						//目标区域
						var targetCell = panelUsage.info[targetModule.yIndex + y][targetModule.xIndex + x];
						if(x >= sourceModule.xCells || y >= sourceModule.yCells){
							//targetCell.clean();
							targetCell.useInfo.moduleId = null;
							targetCell.useInfo.xIndex = 0;
							targetCell.useInfo.yIndex = 0;
						}else{
							targetCell.useInfo.moduleId = sourceModule.id;
							targetCell.useInfo.xIndex = x;
							targetCell.useInfo.yIndex = y;
						}
					}
				}

				//模块信息更新
				var tempInfo = {
					x: sourceModule.x,
					y: sourceModule.y,
					xIndex: sourceModule.xIndex,
					yIndex: sourceModule.yIndex
				};

				sourceModule.x = targetModule.x;
				sourceModule.y = targetModule.y;
				sourceModule.xIndex = targetModule.xIndex;
				sourceModule.yIndex = targetModule.yIndex;

				targetModule.x = tempInfo.x;
				targetModule.y = tempInfo.y;
				targetModule.xIndex = tempInfo.xIndex;
				targetModule.yIndex = tempInfo.yIndex;
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

			for(var y = 0; y < options.yCells; y++) {
				var yAxis = [];
				for(var x = 0; x < options.xCells; x++) {
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
						yIndex: y
					})
				}
				axis.push(yAxis)
			}

			panelUsage.info = axis;
			console.log(axis);
		}

		function onEvent() {
			var module = {
				startDrag: function(event) {
					var $target = $(event.target);
					//判断是否可拖动
					if($target.attr('data-drag') !== 'true') {
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
				onDrag: function(event) {
					if(!this.target) {
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

					//设置移动后的位置
					$(this.target).css({
						top: endY + 'px',
						left: endX + 'px'
					});
				},
				endDrag: function(event) {
					if(!this.target) {
						return;
					}

					//设置放置点
					var targetCell = panelUsage.getNearestCell({
						x: this.x,
						y: this.y
					});

					var moduleId = $(this.target).attr('data-id');
					var sourceModule = modules[moduleId];

					//如果移动的目标位置已经有模块，先判断是否可以置换，如果可置换再判断单元块是否够，否则放回原位置
					if(targetCell.useInfo.moduleId &&
						targetCell.useInfo.moduleId !== sourceModule.id &&
						!modules[targetCell.useInfo.moduleId].swap ){
						//目标位置已经有模块而且不可置换，放回原处
						targetCell = sourceModule;
					}else{
						//没有模块，或有模块且可置换，查看单元块是否够用
						if(true) {
							if(targetCell.useInfo.moduleId) {
								var targetModule = modules[targetCell.useInfo.moduleId];

								panelUsage.swapModule(sourceModule, targetModule);
								targetCell = sourceModule;

								$panel.find('.module[data-id=' + targetModule.id + ']').animate({
									top: targetModule.y + 'px',
									left: targetModule.x + 'px'
								}, 200);
							}else{
								panelUsage.updateModule(sourceModule, targetCell);
							}
						}else {
							targetCell = sourceModule;
						}
					}

					$(this.target).animate({
						top: targetCell.y + 'px',
						left: targetCell.x + 'px'
					}, 200);


					$(this.target).removeClass('drag');
					this.target = null;

					this.x = 0;
					this.y = 0;
					this.width = 0;
					this.height = 0;
					this.clickX = 0;
					this.clickY = 0;

					console.log(panelUsage.info);
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

			modules[module.id] = module;
		}

		function renderModules() {
			//遍历modules，根据位置设置
			//renderModule();
		}

		this.refresh = function() {
			render();
		};

		this.setRate = function (x, y) {
			options.xCells = x;
			options.yCells = y;
			//重新计算，绘图
		};

		this.createMoudle = function (params) {
			var x = 0;
			var y = 0;

			if (modules.length !== 0) {
				//根据大小计算放置位置，如果没有合适位置则提示
			}

			var moduleId = 'module' + moduleIndex;
			//wait,创建模块时，设置初始位置
			panelUsage.getValidModuleRate();

			var module = {
				id: moduleId,
				xCells: params.xCells,
				yCells: params.yCells,
				width: width / options.xCells * params.xCells,
				height: height / options.yCells * params.yCells,
				drag: params.drag,
				swap: params.swap,
				x: x,
				y: y,
				xIndex: 0,
				yIndex: 0
			};

			panelUsage.updateModule(module, panelUsage.info[0][0]);

			renderModule(module);
			moduleIndex++;

			return true;
		};

		this.deleteMoudle = function (id) {
			$('.module[data-id=' + id + ']').remove();

			delete modules[id];
		};

		this.clean = function () {
			$panel.find('.module').remove();

			modules = {};
		};

		this.save = function () {
			//转换成后台需要的结构，然后ajax上传
		};

		this.delete = function () {
			this.clean();
			$panel.empty();
		};

		$panel.on('click', '.delete_btn', function(event) {
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