/**
 * Created by chengwb on 2016/9/4.
 */
(function(global, $){
    function Module(option) {
        this.id = '';//自动生成uuid
        this.x = 0;
        this.y = 0;
        this.width = 1;
        this.height = 1;
    }

    function PanelTemplate() {
        var id = '';
        var width = 1;
        var height = 1;
        var cell = {
            width: 800,
            height: 500
        };
        var modules = [{
            id: '',
            x: 0,
            y: 0,
            width: 1,
            height: 1
        }];
    }

    PanelTemplate.prototype.setCellSize = function(width, height) {
        if(width) {
            this.cell.width = width;
        }
        if(height) {
            this.cell.height = height;
        }
    }
})(window, jQuery);