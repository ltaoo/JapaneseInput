import { base, Handler } from "@/domains/base";

import { point2D, bezier, translate, rotate, deg, gradient, divAtt } from "./utils";
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
  next_page: ComicBookPage<any>;
  side: "forward" | "backward";
  //   folding: ComicBookPage<any>;
  $turn: ComicBook<any>;
  $elm: ElementJQueryLikeCore;
  $wrap: ElementJQueryLikeCore;
  "z-index"?: number;
  duration: number;
  acceleration?: boolean;
  frontGradient: boolean;
  backGradient: boolean;
  corners: "forward" | "backward" | "all";
};

export function PageFlipEffect(props: PageFlipProps) {
  let _opts = props;

  let _size = { width: 400, height: 500 };
  let _elevation = 50;
  let _data: { corner: null | FlipCorner2; point: null | { corner: FlipCorner2; x: number; y: number } } = {
    corner: null,
    point: null,
  };
  let _z_index = 0;
  let _effect: null | {
    turning: boolean;
    handle: NodeJS.Timeout;
  } = null;
  let _initialized = false;
  //   let _wrapper = ElementJQueryLikeCore({
  //     tag: "div",
  //     parent: null,
  //   });
  //   let _fpage = ElementJQueryLikeCore({
  //     tag: "div",
  //     parent: null,
  //   });
  //   let _fwrapper = ElementJQueryLikeCore({
  //     tag: "div",
  //     parent: null,
  //   });
  //   let _ashadow = ElementJQueryLikeCore({
  //     tag: "div",
  //     parent: null,
  //   });
  //   let _bshadow = ElementJQueryLikeCore({
  //     tag: "div",
  //     parent: null,
  //   });
  let _wrapper: ElementJQueryLikeCore | null = null;
  let _fpage: ElementJQueryLikeCore | null = null;
  let _tmp: ElementJQueryLikeCore | null = null;
  let _fwrapper: ElementJQueryLikeCore | null = null;
  let _ashadow: ElementJQueryLikeCore | null = null;
  let _bshadow: ElementJQueryLikeCore | null = null;
  let _fparent = props.$turn.$fparent;
  //   let _elm = props.$elm;

  const _methods = {
    initialize() {
      _methods._addPageWrapper();
      //       console.log("[Flip]initialize completed");
      _initialized = true;
    },
    disable(disabled?: boolean) {},
    _addPageWrapper() {
      console.log("[Flip]_addPageWrapper 1", _wrapper);
      //       if (_wrapper) {
      //         return;
      //       }
      //       const parent = _elm.parent();
      //       if (!parent) {
      //         return;
      //       }
      //       if (!_fparent) {
      //         _fparent = ElementJQueryLikeCore({ tag: "div", parent: null });
      //         _fparent.css({ "pointer-events": "none" });
      //         _fparent.hide();
      //         _fparent.data().flip = 0;

      //         if (_opts.$turn) {
      //           _fparent.css(divAtt(-_opts.$turn.$elm.offset().top, -_opts.$turn.$elm.offset().left, "auto", "visible").css);
      //           _fparent.appendTo(_opts.$turn.$elm);
      //         } else {
      //           _fparent.css(divAtt(0, 0, "auto", "visible").css);
      //           // append to body
      //         }
      //       }
      props.$elm.css({ position: "absolute", top: 0, left: 0, bottom: "auto", right: "auto" });
      //       const parent = props.$elm.parent();
      const parent = props.$wrap;
      _wrapper = ElementJQueryLikeCore({
        name: "flip_wrapper",
        tag: "div",
        parent: null,
      });
      //       _wrapper.css(divAtt(0, 0, props.$elm.getCss("z-index")).css);
      _fwrapper = ElementJQueryLikeCore({
        name: "flip_fwrapper",
        tag: "div",
        parent: null,
      });
      console.log("[Flip]_addPageWrapper 2 ------------------------ ", props.$elm, parent);
      if (parent) {
        console.log("[Flip]_addPageWrapper 3 ------------------------ ", props.$elm, parent.name);
        _fwrapper.css(divAtt(parent.offset().top, props.page % 2 === 0 ? 0 : _size.width).css);
      }
      _fwrapper.hide();
      _fpage = ElementJQueryLikeCore({
        name: "flip_fpage",
        tag: "div",
        parent: null,
      });
      _fpage.css({ cursor: "default" });
      _tmp = ElementJQueryLikeCore({ name: "flip_tmp", tag: "div", parent: _fwrapper });
      _tmp.css(divAtt(0, 0, 0, "visible").css);

      _fpage.appendTo(_tmp);
      _tmp.appendTo(_fwrapper);
      _fwrapper.appendTo(_fparent);

      if (_opts.frontGradient) {
        _ashadow = ElementJQueryLikeCore({
          name: "flip_a_shadow",
          tag: "div",
          parent: null,
        });
        _ashadow.css(divAtt(0, 0, 1).css);
        _fpage.appendTo(_ashadow);
      }
      _methods.resize(true);
    },
    resize(full: boolean) {
      const width = props.$elm.width();
      const height = props.$elm.height();
      const size = Math.round(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)));
      //       console.log("[Flip]resize - before if (full)", size);
      if (full) {
        console.log("[Flip]resize - after if (full", size, { _wrapper, _fwrapper, _tmp, _fpage, _ashadow, _bshadow });
        _wrapper?.css({ width: size, height: size });
        _fwrapper?.css({ width: size, height: size });
        _tmp?.css({ width, height });
        _fpage?.css({ width: height, height: width });
        if (_opts.frontGradient) {
          _ashadow?.css({ width: height, height: width });
        }
        if (_methods._backGradient()) {
          _bshadow?.css({ width: 500, height: 400 });
        }
      }
      const parent = props.$elm.parent();
      if (parent?.$elm?.is(":visible")) {
        _fwrapper?.css({ top: parent.offset().top, left: parent.offset().left });
      }
      if (_opts.$turn) {
        const offset = _opts.$turn.$elm.offset();
        _fparent?.css({ top: -offset.top, left: -offset.left });
      }
      _methods.z(_opts["z-index"]);
    },
    z(level: number = 0) {
      _z_index = level;
      if (_fwrapper) {
        _fwrapper.css({ "z-index": 1000 });
      }
    },
    update_opts(merged: Partial<PageFlipProps>) {
      //
    },
    _backGradient() {
      if (!_opts.backGradient) {
        return false;
      }
      const gradient =
        _opts.$turn.display === "single" || (_opts.page !== 2 && _opts.page !== _opts.$turn.page_count - 1);
      //       console.log("[Flip]_backGradient", _opts.backGradient);
      if (gradient) {
        if (!_bshadow) {
          _bshadow = ElementJQueryLikeCore({ name: "flip_b_shadow", tag: "div", parent: null });
          _bshadow.css(divAtt(0, 0, 1).css);
          //   _bshadow.css({ width: 500, height: 400 });
          _bshadow.appendTo(props.$elm.parent());
        }
        return true;
      }
      return false;
    },
    turnPage(corner?: FlipCorner2) {
      console.log("[BIZ]comic_book/flip - turn_page", corner);
      const allowed_corner = {
        corner: _data.corner ? _data.corner : corner || this._cAllowed()[0],
      };
      const p1 = _data.point || _methods._c(allowed_corner.corner, _elevation);
      const p4 = _methods._c2(allowed_corner.corner);

      console.log("[Flip]turnPage - 2", allowed_corner, p1, p4);

      // 开始翻页
      bus.emit(Events.Flip);

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
      console.log("[Flip]_showFoldedPage 1", corner, animate);

      const folding = _methods._foldingPage();
      // const dd = this.data(),
      // data = dd.f;

      if (!_data.point || _data.point.corner !== corner.corner) {
        // var event = $.Event("start");
        // this.trigger(event, [data.opts, c.corner]);
        bus.emit(Events.Start, {
          event: { stopPropagation: () => {}, preventDefault: () => {} },
          flip: result,
          corner: corner.corner,
        });
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
        if (!_fwrapper?.$elm?.is(":visible")) {
          _fparent.show();
          _methods._moveFoldingPage(true);
          _fwrapper?.show();
          if (_bshadow) {
            _bshadow.show();
          }
        }
        return true;
      }
      return false;
    },
    _moveFoldingPage(bool: boolean) {
      const folding = _methods._foldingPage();
      if (folding) {
        if (bool) {
        }
      }
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
      if (!_wrapper) {
        return;
      }
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
      //       let h = _wrapper.height();
      const h = 640;
      let o = _methods._c(point.corner);
      const top = point.corner.substr(0, 1) === "t";
      const left = point.corner.substr(1, 1) === "l";
      function compute() {
        let rel = point2D(o.x ? o.x - point.x : point.x, o.y ? o.y - point.y : point.y);
        let tan = Math.atan2(rel.y, rel.x);
        let middle;
        alpha = Math.PI / 2 - tan;
        a = deg(alpha);
        middle = point2D(left ? width - rel.x / 2 : point.x + rel.x / 2, rel.y / 2);
        const gamma = alpha - Math.atan2(middle.y, middle.x);
        const distance = Math.max(0, Math.sin(gamma) * Math.sqrt(Math.pow(middle.x, 2) + Math.pow(middle.y, 2)));
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
          const beta = Math.PI - alpha;
          const dd = h - height / Math.sin(beta);
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
        // console.log(tr, height, h, x[1]);
        let f = ["0", "auto"];
        const mvW = ((width - h) * x[0]) / 100;
        const mvH = ((height - h) * x[1]) / 100;
        let v = { left: f[c[0]], top: f[c[1]], right: f[c[2]], bottom: f[c[3]] };
        let aliasingFk = a != 90 && a != -90 ? (left ? -1 : 1) : 0;
        // x = x[0] + "% " + x[1] + "%";
        const x2 = x[0] + "% " + x[1] + "%";
        props.$elm.css(v);
        props.$elm.transform(rotate(a) + translate(tr.x + aliasingFk, tr.y, ac), x2);
        if (_fpage) {
          _fpage.parent()?.css(v);
        }
        if (_wrapper) {
          _wrapper.transform(translate(-tr.x + mvW - aliasingFk, -tr.y + mvH, ac) + rotate(-a), x2);
        }
        if (_fwrapper) {
          const v1 = translate(-tr.x + mv.x + mvW, -tr.y + mv.y + mvH, ac);
          const v2 = rotate(-a);
          //   console.log("before data.fwrapper.transform", -tr.y, mv.y, mvH);
          _fwrapper.transform(v1 + v2, x2);
        }
        if (_tmp) {
          _tmp.transform(rotate(a) + translate(tr.x + df.x - mv.x, tr.y + df.y - mv.y, ac), x2);
        }

        if (_opts.frontGradient) {
          if (_ashadow) {
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
        }
        if (_methods._backGradient() && gradientOpacity !== undefined) {
          if (_bshadow) {
            //     console.log("[Flip]_backGradient -before gradient( _bshadow", left, top);
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
      }
      switch (point.corner) {
        case "tl":
          point.x = Math.max(point.x, 1);
          compute();
          transform(tr, [1, 0, 0, 1], [100, 0], a);
          if (_fpage) {
            _fpage.transform(translate(-height, -width, ac) + rotate(90 - a * 2), "100% 100%");
          }
          if (folding) {
            folding.$elm.transform(rotate(90) + translate(0, -height, ac), "0% 0%");
          }
          break;
        case "tr":
          point.x = Math.min(point.x, width - 1);
          compute();
          transform(point2D(-tr.x, tr.y), [0, 0, 0, 1], [0, 0], -a);
          if (_fpage) {
            _fpage.transform(translate(0, -width, ac) + rotate(-90 + a * 2), "0% 100%");
          }
          if (folding) {
            folding.$elm.transform(rotate(270) + translate(-width, 0, ac), "0% 0%");
          }
          break;
        case "bl":
          point.x = Math.max(point.x, 1);
          compute();
          transform(point2D(tr.x, -tr.y), [1, 1, 0, 0], [100, 100], -a);
          if (_fpage) {
            _fpage.transform(translate(-height, 0, ac) + rotate(-90 + a * 2), "100% 0%");
          }
          if (folding) {
            folding.$elm.transform(rotate(270) + translate(-width, 0, ac), "0% 0%");
          }
          break;
        case "br":
          point.x = Math.min(point.x, width - 1);
          compute();
          transform(point2D(-tr.x, -tr.y), [0, 1, 1, 0], [0, 100], a);
          if (_fpage) {
            _fpage.transform(rotate(90 - a * 2), "0% 0%");
          }
          if (folding) {
            folding.$elm.transform(rotate(90) + translate(0, -height, ac), "0% 0%");
          }
          break;
      }
      _data.point = point;
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
      for (j = 0; j < len; j++) {
        diff.push(opts.to[j] - opts.from[j]);
      }
      //       _effect = opts;
      _effect = {
        turning: true,
        handle: setInterval(f, fps),
      };
      f();
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
  const result = {
    state: _state,
    methods: _methods,
    get $next() {
      return props.next_page;
    },
    get $wrapper() {
      return _wrapper;
    },
    get $fwrapper() {
      return _fwrapper;
    },
    get $tmp() {
      return _tmp;
    },
    get $fpage() {
      return _fpage;
    },
    get $ashadow() {
      return _ashadow;
    },
    get $bshadow() {
      return _bshadow;
    },
    get opts() {
      return _opts;
    },
    get side() {
      return _opts.side;
    },
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
  return result;
}

export type PageFlipEffect = ReturnType<typeof PageFlipEffect>;
