import { base, Handler } from "@/domains/base";

import { CanvasLayerCore } from "./layer";
import { CanvasPointer } from "./mouse";

const debug = false;

type CanvasProps = {};
export function CanvasCore(props: CanvasProps) {
  let _mounted = false;
  const _layers: {
    //     range: CanvasLayerCore;
    grid: CanvasLayerCore;
    path: CanvasLayerCore;
    //     graph: CanvasLayerCore;
  } = {
    //     range: CanvasLayerCore({
    //       zIndex: 999,
    //       disabled: true,
    //     }),
    grid: CanvasLayerCore({
      zIndex: 998,
      disabled: true,
//       onMounted(layer) {
//         layer.drawGrid(() => {
//           console.log("The Grid has Draw");
//         });
//       },
    }),
    path: CanvasLayerCore({
      zIndex: 99,
    }),
    //     graph: CanvasLayerCore({
    //       zIndex: 9,
    //     }),
  };
  let _cur_layer = _layers.path;
  let _size = {
    width: 0,
    height: 0,
  };
  let _dpr = 1;
  /** 网格区域信息 */
  let _grid = {
    x: 0,
    y: 0,
    width: 512,
    height: 512,
    unit: 16,
    lineWidth: 0.5,
    color: "#cccccc",
  };
  /** 画布上的图形 */
  let _debug = false;

  const state = {};

  enum Events {
    /** 重新绘制 canvas 内容 */
    Refresh,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Refresh]: void;
    [Events.Change]: typeof state;
  };
  // 事件
  const bus = base<TheTypesOfEvents>();

  const ins = {
    SymbolTag: "Canvas" as const,
    state: state,
    get layers() {
      return _layers;
    },
    get layerList(): CanvasLayerCore[] {
      return Object.keys(_layers).map((name) => {
        // @ts-ignore
        return _layers[name];
      });
    },
    createLayer() {},
    // appendLayer(layer: CanvasLayer) {
    //   if (_layers.includes(layer)) {
    //     return;
    //   }
    //   _layers.push(layer);
    // },
    /** 图形绘制层 */
    get layer() {
      return _cur_layer;
    },
    get $pointer() {
      return _$pointer;
    },
    get size() {
      return _size;
    },
    setSize(size: { width: number; height: number }) {
      Object.assign(_size, size);
    },
    get mounted() {
      return _mounted;
    },
    setMounted() {
      _mounted = true;
    },
    setDPR(v: number) {
      _dpr = v;
    },
    get grid() {
      return _grid;
    },
    setGrid(grid: { x: number; y: number; width?: number; height?: number }) {
      Object.assign(_grid, grid);
    },
    tagCurObjectAsCopy() {
      //
    },
    appendObject() {},
    inGrid(pos: { x: number; y: number }) {
      if (pos.x >= _grid.x && pos.x <= _grid.x + _grid.width && pos.y >= _grid.y && pos.y <= _grid.y + _grid.height) {
        return true;
      }
      return false;
    },
    update() {
      bus.emit(Events.Refresh);
    },
    get debug() {
      return _debug;
    },
    setDebug() {
      _debug = !_debug;
    },
    log() {
      if (_cur_layer) {
        const content = _cur_layer.logs.join("\n");
        console.log(content);
      }
    },
    handleMouseDown(pos: { x: number; y: number }) {
      _$pointer.handleMouseDown(pos);
    },
    handleMouseMove(pos: { x: number; y: number }) {
      // console.log("[BIZ]canvas/index - handleMouseMove", _cur_object);
      _$pointer.handleMouseMove(pos);
    },
    handleMouseUp(pos: { x: number; y: number }) {
      // const pos = toFixPoint(event);
      _$pointer.handleMouseUp(pos);
    },
    onPointerdown(...args: Parameters<typeof _$pointer.onMousedown>) {
      _$pointer.onMousedown(...args);
    },
    onPointermove(...args: Parameters<typeof _$pointer.onMousemove>) {
      _$pointer.onMousemove(...args);
    },
    onPointerup(...args: Parameters<typeof _$pointer.onMouseup>) {
      _$pointer.onMouseup(...args);
    },
    onRefresh(handler: Handler<TheTypesOfEvents[Events.Refresh]>) {
      return bus.on(Events.Refresh, handler);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };

  const _$pointer = CanvasPointer({ canvas: ins });
  return ins;
}

export type CanvasCore = ReturnType<typeof CanvasCore>;
