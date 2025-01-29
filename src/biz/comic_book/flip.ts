import { base, Handler } from "@/domains/base";

import { point2D, bezier, translate, rotate, deg, gradient } from "./utils";
import { ComicBook } from "./index";
import { ComicBookPage } from "./page";
import { ElementJQueryLikeCore } from "./element";

// Contansts used for each corner
// tl * tr
// *     *
// bl * br
const Corners: {
  backward: FlipCorner2[];
  forward: FlipCorner2[];
  all: FlipCorner2[];
} = {
  backward: ["bl", "tl"],
  forward: ["br", "tr"],
  all: ["tl", "bl", "tr", "br"],
};
type FlipCorner2 = "tl" | "bl" | "tr" | "br";
// type FlipCorner = "backward" | "forward" | "all";
type PageFlipProps = {
  page: number;
  next: number;
  //   folding: ComicBookPage<any>;
  $turn: ComicBook<any>;
  duration: number;
  acceleration?: boolean;
  frontGradient: boolean;
  backGradient: boolean;
  corners: "forward" | "backward" | "all";
};

export function PageFlipEffect(props: PageFlipProps) {
  let _opts = props;

  let _size = { width: 0, height: 0 };
  let _elevation = 0;
  let _data: { corner: null | FlipCorner2; point: null | { corner: FlipCorner2; x: number; y: number } } = {
    corner: null,
    point: null,
  };
  let _effect: null | {
    turning: boolean;
    handle: NodeJS.Timeout;
  } = null;
  let _initialized = false;
  let _wrapper = ElementJQueryLikeCore({
    tag: "div",
    parent: null,
  });
  let _fpage = ElementJQueryLikeCore({
    tag: "div",
    parent: null,
  });
  let _fwrapper = ElementJQueryLikeCore({
    tag: "div",
    parent: null,
  });
  let _ashadow = ElementJQueryLikeCore({
    tag: "div",
    parent: null,
  });
  let _bshadow = ElementJQueryLikeCore({
    tag: "div",
    parent: null,
  });

  const _methods = {
    initialize() {
      _methods._addPageWrapper();
      _initialized = true;
    },
    disable(disabled?: boolean) {},
    _addPageWrapper() {
      if (_wrapper) {
        return;
      }
    },
    update_opts(merged: Partial<PageFlipProps>) {
      //
    },
    turnPage(corner?: FlipCorner2) {
      console.log("[BIZ]comic_book/flip - turn_page", corner);
      const allowed_corner = {
        corner: _data.corner ? _data.corner : corner || this._cAllowed()[0],
      };
      const p1 = _data.point || _methods._c(allowed_corner.corner, _elevation);
      const p4 = _methods._c2(allowed_corner.corner);

      _methods.animatef({
        from: [0],
        to: [1],
        duration: _opts.duration,
        // turning: true,
        frame(v) {
          const np = bezier(p1, p1, p4, p4, v);
          _methods._showFoldedPage({
            corner: allowed_corner.corner,
            x: np.x,
            y: np.y,
          });
        },
      });
      _data.corner = null;
    },
    _showFoldedPage(corner: { corner: FlipCorner2; x: number; y: number }, animate?: boolean) {
      //       console.log("[BIZ]comic_book/flip - _showFoldedPage", corner);
      const folding = _methods._foldingPage();
      // const dd = this.data(),
      // data = dd.f;

      if (!_data.point || _data.point.corner !== corner.corner) {
        // var event = $.Event("start");
        // this.trigger(event, [data.opts, c.corner]);
        bus.emit(Events.Start);
        // if (event.isDefaultPrevented()) return false;
      }
      if (folding) {
        if (animate) {
        } else {
          //   console.log("[Flip]_showFoldedPage 3");
          _methods._fold(corner);
          if (_effect && !_effect.turning) {
            _methods.clearEffect();
          }
        }
        return true;
      }
      return false;
    },
    /** 返回对应的 page */
    _foldingPage(): ComicBookPage<any> | null {
      // var opts = this.data().f.opts;
      //       if (_opts.folding) {
      //         return _opts.folding;
      //       }
      if (_opts.$turn) {
        const $turn = _opts.$turn;
        if ($turn.display === "single") {
          return $turn.pages[_opts.next] ? $turn.pages[0] : null;
        }
        return $turn.pages[_opts.next];
      }
      return null;
    },
    _fold(point: { corner: FlipCorner2; x: number; y: number }) {
      let a = 0;
      let alpha = 0;
      let beta;
      let px;
      let gradientSize;
      let gradientEndPointA: { x: number; y: number };
      let gradientEndPointB: { x: number; y: number };
      let gradientStartV: number | undefined;
      let gradientOpacity: number | undefined;
      let mv = point2D(0, 0);
      let df = point2D(0, 0);
      let tr = point2D(0, 0);
      const width = _size.width;
      const height = _size.height;
      const folding = _methods._foldingPage();
      let tan = Math.tan(alpha);
      let ac = _opts.acceleration;
      let h = _wrapper.height();
      let o = _methods._c(point.corner);
      let top = point.corner.substr(0, 1) == "t";
      let left = point.corner.substr(1, 1) == "l";
      function compute() {
        let rel = point2D(o.x ? o.x - point.x : point.x, o.y ? o.y - point.y : point.y);
        let tan = Math.atan2(rel.y, rel.x);
        let middle;
        alpha = Math.PI / 2 - tan;
        a = deg(alpha);
        middle = point2D(left ? width - rel.x / 2 : point.x + rel.x / 2, rel.y / 2);
        let gamma = alpha - Math.atan2(middle.y, middle.x);
        let distance = Math.max(0, Math.sin(gamma) * Math.sqrt(Math.pow(middle.x, 2) + Math.pow(middle.y, 2)));
        tr = point2D(distance * Math.sin(alpha), distance * Math.cos(alpha));

        if (alpha > Math.PI / 2) {
          tr.x = tr.x + Math.abs(tr.y * Math.tan(tan));
          tr.y = 0;

          if (Math.round(tr.x * Math.tan(Math.PI - alpha)) < height) {
            point.y = Math.sqrt(Math.pow(height, 2) + 2 * middle.x * rel.x);
            if (top) {
              point.y = height - point.y;
            }
            return compute();
          }
        }
        if (alpha > Math.PI / 2) {
          let beta = Math.PI - alpha;
          let dd = h - height / Math.sin(beta);
          mv = point2D(Math.round(dd * Math.cos(beta)), Math.round(dd * Math.sin(beta)));
          if (left) {
            mv.x = -mv.x;
          }
          if (top) {
            mv.y = -mv.y;
          }
        }
        let px = Math.round(tr.y / Math.tan(alpha) + tr.x);
        let side = width - px;
        let sideX = side * Math.cos(alpha * 2);
        let sideY = side * Math.sin(alpha * 2);
        df = point2D(Math.round(left ? side - sideX : px + sideX), Math.round(top ? sideY : height - sideY));
        // GRADIENTS
        let gradientSize = side * Math.sin(alpha);
        let endingPoint = _methods._c2(point.corner);
        let far = Math.sqrt(Math.pow(endingPoint.x - point.x, 2) + Math.pow(endingPoint.y - point.y, 2));
        gradientOpacity = far < width ? far / width : 1;

        if (_opts.frontGradient) {
          gradientStartV = gradientSize > 100 ? (gradientSize - 100) / gradientSize : 0;
          gradientEndPointA = point2D(
            ((gradientSize * Math.sin(Math.PI / 2 - alpha)) / height) * 100,
            ((gradientSize * Math.cos(Math.PI / 2 - alpha)) / width) * 100
          );
          if (top) {
            gradientEndPointA.y = 100 - gradientEndPointA.y;
          }
          if (left) {
            gradientEndPointA.x = 100 - gradientEndPointA.x;
          }
        }
        if (_methods._backGradient()) {
          gradientEndPointB = point2D(
            ((gradientSize * Math.sin(alpha)) / width) * 100,
            ((gradientSize * Math.cos(alpha)) / height) * 100
          );
          if (!left) {
            gradientEndPointB.x = 100 - gradientEndPointB.x;
          }
          if (!top) {
            gradientEndPointB.y = 100 - gradientEndPointB.y;
          }
        }
        //
        tr.x = Math.round(tr.x);
        tr.y = Math.round(tr.y);
        return true;
      }
      function transform(tr: { x: number; y: number }, c: number[], x: number[], a: number) {
        let f = ["0", "auto"];
        let mvW = ((width - h) * x[0]) / 100;
        let mvH = ((height - h) * x[1]) / 100;
        let v = { left: f[c[0]], top: f[c[1]], right: f[c[2]], bottom: f[c[3]] };
        let aliasingFk = a != 90 && a != -90 ? (left ? -1 : 1) : 0;
        // x = x[0] + "% " + x[1] + "%";
        const x2 = x[0] + "% " + x[1] + "%";
        _methods.css(v).transform(rotate(a) + translate(tr.x + aliasingFk, tr.y, ac), x2);
        _fpage.parent()?.css(v);
        _wrapper.transform(translate(-tr.x + mvW - aliasingFk, -tr.y + mvH, ac) + rotate(-a), x2);
        _fwrapper.transform(translate(-tr.x + mv.x + mvW, -tr.y + mv.y + mvH, ac) + rotate(-a), x2);
        _fpage.parent()?.transform(rotate(a) + translate(tr.x + df.x - mv.x, tr.y + df.y - mv.y, ac), x2);

        if (_opts.frontGradient && gradientEndPointA && gradientStartV && gradientOpacity !== undefined) {
          gradient(
            _ashadow,
            point2D(left ? 100 : 0, top ? 100 : 0),
            point2D(gradientEndPointA.x, gradientEndPointA.y),
            [
              [gradientStartV, "rgba(0,0,0,0)"],
              [(1 - gradientStartV) * 0.8 + gradientStartV, "rgba(0,0,0," + 0.2 * gradientOpacity + ")"],
              [1, "rgba(255,255,255," + 0.2 * gradientOpacity + ")"],
            ],
            3
            //     alpha
          );
        }
        if (_methods._backGradient() && gradientOpacity !== undefined) {
          gradient(
            _bshadow,
            point2D(left ? 0 : 100, top ? 0 : 100),
            point2D(gradientEndPointB.x, gradientEndPointB.y),
            [
              [0.8, "rgba(0,0,0,0)"],
              [1, "rgba(0,0,0," + 0.3 * gradientOpacity + ")"],
              [1, "rgba(0,0,0,0)"],
            ],
            3
          );
        }
      }
      switch (point.corner) {
        case "tl":
          point.x = Math.max(point.x, 1);
          compute();
          transform(tr, [1, 0, 0, 1], [100, 0], a);
          _fpage.transform(translate(-height, -width, ac) + rotate(90 - a * 2), "100% 100%");
          if (folding) {
            folding.methods.transform(rotate(90) + translate(0, -height, ac), "0% 0%");
          }
          break;
        case "tr":
          point.x = Math.min(point.x, width - 1);
          compute();
          transform(point2D(-tr.x, tr.y), [0, 0, 0, 1], [0, 0], -a);
          _fpage.transform(translate(0, -width, ac) + rotate(-90 + a * 2), "0% 100%");
          if (folding) {
            folding.methods.transform(rotate(270) + translate(-width, 0, ac), "0% 0%");
          }
          break;
        case "bl":
          point.x = Math.max(point.x, 1);
          compute();
          transform(point2D(tr.x, -tr.y), [1, 1, 0, 0], [100, 100], -a);
          _fpage.transform(translate(-height, 0, ac) + rotate(-90 + a * 2), "100% 0%");
          if (folding) {
            folding.methods.transform(rotate(270) + translate(-width, 0, ac), "0% 0%");
          }
          break;
        case "br":
          point.x = Math.min(point.x, width - 1);
          compute();
          transform(point2D(-tr.x, -tr.y), [0, 1, 1, 0], [0, 100], a);
          _fpage.transform(rotate(90 - a * 2), "0% 0%");
          if (folding) {
            folding.methods.transform(rotate(90) + translate(0, -height, ac), "0% 0%");
          }
          break;
      }
      _data.point = point;
    },
    _backGradient() {
      return true;
    },
    clearEffect() {
      if (_effect !== null) {
        clearInterval(_effect.handle);
      }
      _effect = null;
    },
    animatef(opts?: {
      from: number[];
      to: number[];
      fps?: number;
      duration?: number;
      easing?: (x: number, t: number, b: number, c: number, data: number) => number;
      frame?: (v: number) => void;
      complete?: () => void;
    }) {
      if (_effect !== null) {
        clearInterval(_effect.handle);
      }
      if (!opts) {
        _effect = null;
        return;
      }
      const easing =
        opts.easing ||
        function (x, t, b, c, data) {
          return c * Math.sqrt(1 - (t = t / data - 1) * t) + b;
        };
      const duration = opts.duration || 500;
      const fps = opts.fps || 30;

      let j;
      let diff: number[] = [];
      let len = opts.to.length;
      //       let that = this;
      let time = -fps;
      const f = function () {
        let j;
        let v = [];
        time = Math.min(duration, time + fps);

        for (j = 0; j < len; j++) v.push(easing(1, time, opts.from[j], diff[j], duration));
        if (opts.frame) {
          opts.frame(v[0]);
        }

        if (time === opts.duration) {
          if (_effect !== null) {
            clearInterval(_effect.handle);
          }
          _effect = null;
          //   delete data["effect"];
          //   that.data(data);
          if (opts.complete) {
            opts.complete();
          }
        }
      };
    },
    _c(corner: FlipCorner2, elevation: number = 0) {
      return {
        tl: point2D(elevation, elevation),
        tr: point2D(_size.width - elevation, elevation),
        bl: point2D(elevation, _size.height - elevation),
        br: point2D(_size.width - elevation, _size.height - elevation),
      }[corner];
    },
    _c2(corner: FlipCorner2) {
      return {
        tl: point2D(_size.width * 2, 0),
        tr: point2D(-_size.width, 0),
        bl: point2D(_size.width * 2, _size.height),
        br: point2D(-_size.width, _size.height),
      }[corner];
    },
    _cAllowed(): FlipCorner2[] {
      return Corners[_opts.corners];
    },
    setNext(v: number) {
      _opts.next = v;
    },
  };
  const _state = {};
  enum Events {
    Pressed,
    Released,
    Flip,
    Start,
    End,
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Flip]: void;
    [Events.Start]: {
      event: { stopPropagation: () => void; preventDefault: () => void };
      flip: PageFlipEffect;
      corner: string;
    };
    [Events.End]: void;
    [Events.Pressed]: void;
    [Events.Released]: void;
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();
  return {
    state: _state,
    methods: _methods,
    get next() {
      return _opts.next;
    },
    get page() {
      return _opts.page;
    },
    onStateChange: (handler: Handler<TheTypesOfEvents[Events.StateChange]>) => {
      bus.on(Events.StateChange, handler);
    },
    onFlip: (handler: Handler<TheTypesOfEvents[Events.Flip]>) => {
      bus.on(Events.Flip, handler);
    },
    onStart: (handler: Handler<TheTypesOfEvents[Events.Start]>) => {
      bus.on(Events.Start, handler);
    },
    onEnd: (handler: Handler<TheTypesOfEvents[Events.End]>) => {
      bus.on(Events.End, handler);
    },
    onPressed: (handler: Handler<TheTypesOfEvents[Events.Pressed]>) => {
      bus.on(Events.Pressed, handler);
    },
    onReleased: (handler: Handler<TheTypesOfEvents[Events.Released]>) => {
      bus.on(Events.Released, handler);
    },
  };
}

export type PageFlipEffect = ReturnType<typeof PageFlipEffect>;
