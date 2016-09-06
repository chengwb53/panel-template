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
		var cell = {};
		var $panel = $(root);
		var $_panel = $panel.clone();
		var width = 1200;
		var height = 900;
		var position = {};
		var modules = [];
		var moduleIndex = 0;

		function init() {
			position.y = $panel.offset().top;
			position.x = $panel.offset().left;

			width = $panel.width();
			height = $panel.height();

			initCell();
		}

		function initCell() {
			//小数点待处理
			cell.width = width / options.xCells;
			cell.height = height / options.yCells;
		}

		function Event() {
			var module = {
				startDrag: function(event) {
					var $target = $(event.target);
					//判断是否可拖动
					if($target.attr('data-drag') !== 'true') {
						return;
					}

					var offset = $target.offset();
					$target.addClass('drag');

					this.target = event.target;

					//模块相对模板左上角的位置
					this.x = offset.left - position.x;
					this.y = offset.top - position.y;

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
					console.log(this);
					console.log('endX=' + endX + ";endY=" + endY);

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

					console.log(this);
					console.log('endX=' + endX + ";endY=" + endY);
				},
				endDrag: function(event) {
					if(!this.target) {
						return;
					}

					$(this.target).removeClass('drag');
					this.target = null;

					this.x = 0;
					this.y = 0;
					this.width = 0;
					this.height = 0;
					this.clickX = 0;
					this.clickY = 0;
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

		function onEvent() {
			var module;
			var pointCenter = {left: 0, top: 0};//点的中心位置

			$panel.on('mousedown', '.module', function (event) {
				var startX = event.pageX;
				var startY = event.pageY;

				module = this;
				if (options.onDrag && typeof options.onDrag === 'function') {
					options.onDrag(event, {
						x: startX - position.x,
						y: startY - position.y
					})
				}

				$(window.document).on('mousemove', function (event) {
					//获取点在地图上的位置
					var pointPosition = $(module).position();
					//鼠标移动的距离
					var moveX = event.pageX - startX;
					var moveY = event.pageY - startY;
					//移动结束位置
					var endY = 0;
					var endX = 0;

					//判断鼠标位置是否在地图上
					var mouseX = event.pageX - position.x;
					var mouseY = event.pageY - position.y;
					if (mouseX < 0) {
						endX = -(pointCenter.left);
					} else if (mouseX >= width) {
						endX = width - pointCenter.left;
					} else {
						endX = pointPosition.left + moveX;
					}

					if (mouseY < 0) {
						endY = -(pointCenter.top);
					} else if (mouseY >= height) {
						endY = height - pointCenter.top;
					} else {
						endY = pointPosition.top + moveY;
					}

					//检查位置是否超出了地图，如果超出则只移动到地图边缘
					var centerX = endX + pointCenter.left;
					var centerY = endY + pointCenter.top;
					if (centerX >= width) {
						endX = width - pointCenter.left;
					} else if (centerX < 0) {
						endX = -(pointCenter.left);
					}
					if (centerY >= height) {
						endY = height - pointCenter.top;
					} else if (centerY < 0) {
						endY = -(pointCenter.top);
					}

					//设置移动后的位置
					$(module).css({
						top: endY + 'px',
						left: endX + 'px'
					});

					if (options.onDrag && typeof options.onDrag === 'function') {
						options.onDrag(event, {
							x: endX + pointCenter.left,
							y: endY + pointCenter.top
						});
					}

					startX = event.pageX;
					startY = event.pageY;
				});

				$(window.document).on('mouseup', function () {
					$(window.document).off('mousemove');

					if (module) {
						var position = $(module).position();
						if (options.endDrag && typeof options.endDrag === 'function') {
							options.endDrag({
								x: position.left + pointCenter.left,
								y: position.top + pointCenter.top
							});
						}
					}

					$(window.document).off('mouseup');
				});
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
				width: cell.width - 6,
				height: cell.height - 6
			});
		}

		function renderModule(module) {
			$('.module[data-id=' + module.id + ']').css({
				width: module.width,
				height: module.height,
				top: module.y,
				left: module.x
			}).attr('data-drag', module.drag ? 'true' : 'false')
				.attr('data-swap', module.swap ? 'true' : 'false');

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

		this.createMoudle = function (option) {
			var moduleId = 'module' + moduleIndex;
			$panel.append('<div class="module" data-id="' + moduleId + '"><span class="delete_btn">x</span></div>');

			//设置位置,智能计算
			//-6是padding，为了展示块之间的间隔效果
			var module = {
				id: moduleId,
				width: cell.width * option.xCells - 6,
				height: cell.height * option.yCells - 6,
				drag: option.drag,
				swap: option.swap,
				x: 0,
				y: 0
			};

			renderModule(module);
			moduleIndex++;
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

		init();
		render();
		Event();
	}

	global.PanelTemplate = global.PanelTemplate || PanelTemplate;

})(window, jQuery);