import {
  create
} from 'domain';

const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function (ctx) {


  const buttonElements = {};
  let activeButton = null;

  let currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  let nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach((type) => {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove.apply(ctx.container.classList, classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add.apply(ctx.container.classList, classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options = {}) {
    const contain = document.createElement('span');
    const button = document.createElement('span');
    const textspan = document.createElement('span');
    const rightLine = document.createElement('span');

    contain.className = "draw-span-container";

    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;
    textspan.className = "draw-button-text";
    rightLine.className = "draw-button-right-line";

    button.setAttribute('title', options.title);
    textspan.innerHTML = options.label;
    contain.appendChild(textspan);
    contain.appendChild(button);
    contain.appendChild(rightLine);
    options.container.appendChild(contain);

    contain.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      //不需要激活状态注释掉
      // if (clickedButton === activeButton) {
      //   deactivateButtons();
      //   return;
      // }

      setActiveButton(id);
      options.onActivate();
    }, true);
    return button;

  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    const controlGroup = document.createElement('div');
    controlGroup.className = `${Constants.classes.CONTROL_GROUP} ${Constants.classes.CONTROL_BASE}`;

    if (!controls) return controlGroup;

    if (controls.save_bounds) {
      buttonElements.snaped = createControlButton('save_bounds', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_SAVE_BOUNDS,
        title: '保存边界',
        label: '保存边界',
        onActivate: () => {
          // ctx.snaped = true;
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select" && currentMode != "direct_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.map.fire("saveBoundsClick")
        }
      })
    }
    if (controls[Constants.types.LINE]) {
      buttonElements[Constants.types.LINE] = createControlButton(Constants.types.LINE, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_LINE,
        title: '拆分，ctrl+z可撤销',
        label: '拆分',
        onActivate: () => {
          ctx.map.fire('noFeatureSelect');
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          var selectedFeatures = ctx.store.getSelected();
          var len = selectedFeatures.length;
          if (len == 0) {
            ctx.options.openMessage('没有选中面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (len > 1) {
            ctx.options.openMessage('不可切割多个面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 2) {
            ctx.options.openMessage('选中图形已匹配，请先取消匹配！');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 3) {
            ctx.options.openMessage('已完成不可编辑！');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          ctx.events.changeMode(Constants.modes.DRAW_LINE_STRING)
        }
      });
    }
    if (controls.snaped) {
      buttonElements.snaped = createControlButton('snaped', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_SNAPED,
        title: '抓路切割，单击后ctrl+z可撤销',
        label: '抓路切割',
        onActivate: () => {
          // ctx.snaped = true;
          // 将道路图层和水系图层放入捕捉
          // var layerIds = [];
          // for (var i = 247; i < 325; i++) {
          //   layerIds.push(String(i));
          // }
          // layerIds.push('240');
          // layerIds.push('244')
          ctx.map.fire('noFeatureSelect');
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          var selectedFeatures = ctx.store.getSelected();
          var len = selectedFeatures.length;
          if (len == 0) {
            ctx.options.openMessage('没有选中面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (len > 1) {
            ctx.options.openMessage('不可切割多个面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 2) {
            ctx.options.openMessage('选中图形已匹配，请先取消匹配！');

            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 3) {
            ctx.options.openMessage('已完成不可编辑！');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          var layerIDMap = ctx.map.getStyle().metadata.layerIDMap;
          var layerIds = [];
          for (var key in layerIDMap) {
            var temp = {
              id: key,
              name: layerIDMap[key]
            }
            if (layerIDMap[key].indexOf("LRDL") !== -1) {
              layerIds.push(temp.id);
            }
          }
          var fill_layer = ['gl-draw-polygon-stroke-matched-inactive.cold', 'gl-draw-polygon-fill-matched-inactive.cold', 'gl-draw-polygon-fill-inactive.cold', 'gl-draw-polygon-fill-static.cold', 'gl-draw-polygon-fill-matched-inactive.hot', 'gl-draw-polygon-fill-inactive.hot', 'gl-draw-polygon-fill-active.hot']
          layerIds = layerIds.concat(fill_layer);

          ctx.events.changeMode(Constants.modes.SNAP_DRAW, {
            layerIds: layerIds
          });

        }
      })
    }
    if (controls.createBuilding) {
      buttonElements.snaped = createControlButton('createBuilding', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_CBUILDING,
        title: '添加建筑物',
        label: '添加建筑物',
        onActivate: () => {
          // ctx.snaped = true;

          // ctx.map.fire('createBuilding');
          ctx.map.fire('splitStart');
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.events.changeMode(Constants.modes.CREATE_BUILDING);
        }
      })
    }
    if (controls.reroteBuilding) {
      buttonElements.snaped = createControlButton('reroteBuilding', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_RBUILDING,
        title: '旋转建筑物，点击顺时针旋转90度',
        label: '旋转建筑物',
        onActivate: () => {
          // ctx.snaped = true;

          // ctx.map.fire('createBuilding');
          var selectedFeatures = ctx.store.getSelected();
          var len = selectedFeatures.length;
          if (len == 0) {
            ctx.options.openMessage('没有选中面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (len > 1) {
            ctx.options.openMessage('不可旋转多个面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          ctx.map.fire('reroteBuilding', selectedFeatures[0].id);
          var currentMode = ctx.events.getMode();
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
        }
      })
    }
    if (controls.transformBuilding) {
      buttonElements.snaped = createControlButton('transformBuilding', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_TBUILDING,
        title: '平移建筑物，点击地图上的点即可平移',
        label: '平移建筑物',
        onActivate: () => {
          // ctx.snaped = true;

          // ctx.map.fire('createBuilding');
          var selectedFeatures = ctx.store.getSelected();
          var len = selectedFeatures.length;
          if (len == 0) {
            ctx.options.openMessage('没有选中面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (len > 1) {
            ctx.options.openMessage('不可平移多个面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          ctx.map.fire('transformBuilding', selectedFeatures[0].id);
          var currentMode = ctx.events.getMode();
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
        }
      })
    }
    if (controls.saveBuilding) {
      buttonElements.snaped = createControlButton('saveBuilding', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_SBUILDING,
        title: '保存建筑物',
        label: '保存建筑物',
        onActivate: () => {
          // ctx.snaped = true;

          // ctx.map.fire('createBuilding');
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select" && currentMode != "direct_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.map.fire("saveBuilding")
        }
      })
    }
    if (controls.change_vertex) {
      buttonElements.snaped = createControlButton('change_vertex', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_VERTEX_CHANGE,
        title: '边界调整,ctrl+z可撤销一步,选中节点按delete可以删除节点',
        label: "边界调整",
        onActivate: () => {
          // ctx.snaped = true;
          //判断匹配过的则退回
          var selectedFeatures = ctx.store.getSelected();
          var ids = ctx.store.getSelectedIds();
          if (selectedFeatures.length == 0) {
            ctx.options.openMessage('没有选中要素');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
            return
          }
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.map.fire('startChangeVertex')
          ctx.map.fire("changeVertexClick", {
            ids: ids
          })
          ctx.events.changeVertex();
        }
      })
    }
    if (controls.add_vertex) {
      buttonElements.snaped = createControlButton('add_vertex', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_ADD_VERTEX,
        title: '添加节点，只增加节点，调整请选边界调整按钮',
        label: "添加节点",
        onActivate: () => {
          // ctx.snaped = true;
          var selectedFeatures = ctx.store.getSelected();
          var ids = ctx.store.getSelectedIds();
          if (selectedFeatures.length == 0) {
            ctx.options.openMessage('没有选中要素');
            ctx.map.fire("isOperateError");
            return
          }
          // if (selectedFeatures.length == 1) {
          //   ctx.options.openMessage('单个要素不可调整,需选中所有相邻图形一起调整');
          //   return
          // }
          for (var i = 0; i < selectedFeatures.length; i++) {
            if (selectedFeatures[i].properties.state == 2) {
              ctx.options.openMessage('选中图形已匹配，请先取消匹配！');
              ctx.map.fire("isOperateError");
              ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
              return
            }
            if (selectedFeatures[i].properties.state && selectedFeatures[i].properties.state == 3) {
              ctx.options.openMessage('已完成不可编辑！');
              ctx.map.fire("isOperateError");
              ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
              return
            }
          }
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.map.fire('startAddVertex')
          ctx.map.fire("changeVertexClick", {
            ids: ids
          })
          ctx.events.changeVertex();
          ctx.events.addVertex();
        }
      })
    }
    if (controls.polygon_clip) {
      buttonElements.snaped = createControlButton('polygon_clip', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_PCLIP,
        title: '挖洞',
        label: '挖洞',
        onActivate: () => {
          // ctx.snaped = true;
          ctx.map.fire('noFeatureSelect');
          ctx.map.fire('splitStart');
          var selectedFeatures = ctx.store.getSelected();
          var len = selectedFeatures.length;
          if (len == 0) {
            ctx.options.openMessage('没有选中面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (len > 1) {
            ctx.options.openMessage('不可切割多个面');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 2) {
            ctx.options.openMessage('选中图形已匹配，请先取消匹配！');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          if (selectedFeatures[0].properties.state && selectedFeatures[0].properties.state == 3) {
            ctx.options.openMessage('已完成不可编辑！');
            ctx.map.fire("isOperateError");
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
            return
          }
          ctx.map.fire('drawFlyLand');
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          ctx.events.changeMode(Constants.modes.POLYGON_CLIP);
        }
      })
    }
    if (controls.combine_features) {
      buttonElements.combine_features = createControlButton('combineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
        title: '合并',
        label: '合并',
        onActivate: () => {
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          //添加没有选中要素时的提示
          var selectedFeatures = ctx.store.getSelected();
          if (selectedFeatures.length == 0) {
            ctx.options.openMessage('没有选中要素');
            ctx.map.fire("isOperateError");
            return
          }
          if (selectedFeatures.length < 2) {
            ctx.options.openMessage('必须选中两个以上要素！');
            ctx.map.fire("isOperateError");
            return
          }
          for (var i = 0; i < selectedFeatures.length; i++) {
            // if (selectedFeatures[i].properties.AREA_CODE && selectedFeatures[i].properties.AREA_CODE.length != 12 && selectedFeatures[i].properties.AREA_CODE.length != 15 && selectedFeatures[i].properties.AREA_CODE.length != 16) {
            //   ctx.options.openMessage('所选面中包含飞地，不可合并');
            //   this.changeMode(Constants.modes.SIMPLE_SELECT);
            //   return
            // }
            if (selectedFeatures[i].properties.state && selectedFeatures[i].properties.state == 2) {
              ctx.options.openMessage('选中图形已匹配，请先取消匹配！');
              ctx.map.fire("isOperateError");
              ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
              return
            }
            if (selectedFeatures[i].properties.state && selectedFeatures[i].properties.state == 3) {
              ctx.options.openMessage('已完成不可编辑！');
              ctx.map.fire("isOperateError");
              ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
              return
            }
          }
          ctx.events.combineFeatures();
        }
      });
    }
    if (controls.uncombine_features) {
      buttonElements.uncombine_features = createControlButton('uncombineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_UNCOMBINE_FEATURES,
        title: '打散',
        label: '打散',
        onActivate: () => {
          var currentMode = ctx.events.getMode()
          if (currentMode != "simple_select") {
            ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
          }
          //添加没有选中要素时的提示
          var selectedFeatures = ctx.store.getSelected();
          if (selectedFeatures.length == 0) {
            ctx.options.openMessage('没有选中要素');
            ctx.map.fire("isOperateError");
            return
          }
          ctx.events.uncombineFeatures();
        }
      });
    }
    if (controls[Constants.types.POLYGON]) {
      buttonElements[Constants.types.POLYGON] = createControlButton(Constants.types.POLYGON, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POLYGON,
        title: '绘制面',
        label: '绘制面',
        onActivate: () => ctx.events.changeMode(Constants.modes.DRAW_POLYGON)
      });
    }

    if (controls[Constants.types.POINT]) {
      buttonElements[Constants.types.POINT] = createControlButton(Constants.types.POINT, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POINT,
        title: '添加建筑物',
        onActivate: () => ctx.events.changeMode(Constants.modes.DRAW_POINT)
      });
    }

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_TRASH,
        title: '删除',
        label: '删除',
        onActivate: () => {

          //添加没有选中要素时的提示
          var selectedFeatures = ctx.store.getSelected();
          if (selectedFeatures.length == 0) {
            ctx.options.openMessage('没有选中要素');
            ctx.map.fire("isOperateError");
            return
          }
          for (var i = 0; i < selectedFeatures.length; i++) {
            if (selectedFeatures[i].properties.state != 1) {
              ctx.options.openMessage('选中的图形已匹配不可删除！');
              ctx.map.fire("isOperateError");
              ctx.events.changeMode(Constants.modes.SIMPLE_SELECT)
              return
            }
          }
          ctx.events.trash();
        }
      });
    }
    if (controls.undo) {
      buttonElements.trash = createControlButton('undo', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_UNDO,
        title: '撤销',
        label: '撤销',
        onActivate: () => {
          console.log(ctx)
          ctx.store.undo();
        }
      });
    }
    if (controls.redo) {
      buttonElements.trash = createControlButton('redo', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_REDO,
        title: '恢复',
        label: '恢复',
        onActivate: () => {
          ctx.store.redo();
        }
      });
    }

    return controlGroup;
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(buttonId => {
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    addButtons,
    removeButtons
  };
};