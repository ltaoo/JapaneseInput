import { connect, connectLayer } from "@/biz/canvas/connect.web";

export function CanvasView({ store }) {
  let observer;
  return View({
    attributes: { n: "handwriting-canvas", "data-n": "handwriting-canvas" },
    class: "relative w-full h-full",
    style: { "touch-action": "none" },
    onMounted(event) {
      const element = event.target.get$elm?.() || event.target;
      const mount = () => {
        // Routes are inserted while hidden; initialize only after layout has a size.
        if (!element.clientWidth || !element.clientHeight) return;
        observer?.disconnect();
        connect(store, element);
        for (const [index, layer] of store.layerList.entries()) {
          const canvas = element.children[index];
          const context = canvas.getContext("2d");
          if (context) connectLayer(layer, store, canvas, context);
        }
      };
      observer = new ResizeObserver(mount);
      observer.observe(element);
      mount();
    },
    onUnmounted() { observer?.disconnect(); },
  }, store.layerList.map((layer) => Timeless.Canvas({
    attributes: { n: layer.disabled ? "handwriting-grid" : "handwriting-strokes", "data-n": layer.disabled ? "handwriting-grid" : "handwriting-strokes" },
    class: `absolute inset-0 w-full h-full ${layer.disabled ? "pointer-events-none" : ""}`,
    style: { "z-index": layer.zIndex },
  })));
}
