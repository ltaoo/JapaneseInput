import { base, Handler } from "@/domains/base";

import { ComicBookPage } from "./page";
import { PageFlipEffect } from "./flip";
// import { pagesInDOM } from "../turn/constants";

/** 在 DOM 中需要渲染的页面数量 */
const PageCountPrerender = 6;
const PageWrapStyleByPosition: Record<
  number,
  { top: number; left: number | string; right: number | string; bottom: string }
> = {
  0: { top: 0, left: 0, right: "auto", bottom: "auto" },
  1: { top: 0, right: 0, left: "auto", bottom: "auto" },
};
const DefaultComicBookProps: ComicBookProps = {
  display: "double",
  page: 1,
  page_count: 1,
  width: 0,
  height: 0,
  duration: 600,
  elevation: 50,
  gradients: true,
  acceleration: true,
};
type ComicBookProps = {
  display: "double" | "single";
  page: number;
  //   pages: ComicBookPage[];
  page_count: number;
  width: number;
  height: number;
  duration: number;
  disabled?: boolean;
  gradients: boolean;
  /**
   * Sets the hardware
   * acceleration mode, for
   * touch devices this value
   * must be true.
   */
  acceleration: boolean;
  /**
   * 翻页的阴影
   */
  elevation: number;
};
export function ComicBook<T>(props: Partial<ComicBookProps>) {
  const _props: ComicBookProps = Object.assign(DefaultComicBookProps, props);
  let _initialized = false;
  let _display = _props.display;
  let _page = _props.page;
  let _page_count = _props.page_count;
  let _pages: ComicBookPage<T>[] = [];
  let _pages_map: Record<number, ComicBookPage<T>> = {};
  let _size = { width: _props.width, height: _props.height };
  let _view: number[] = [];
  let _range: number[] = [];
  /** 将要展示的页码 */
  let _target_page = 0;

  const _private_methods = {
    /**
     * 根据页码和布局，返回需要展示的页码
     * @example
     * double
     * view(1) => [0, 1]
     * view(5) => [4, 5]
     *
     * single
     * view(1) => [1]
     */
    view(page: number) {
      if (_display == "double") {
        return page % 2 ? [page - 1, page] : [page, page + 1];
      }
      return [page];
    },
    /**
     * Returns a range of `pagesInDOM` pages that should be in the DOM
     * Example:
     * - page of the current view, return true
     * * page is in the range, return true
     * 0 page is not in the range, return false
     *
     * 1 2-3 4-5 6-7 8-9 10-11 12-13
     * 0 ** ** -- ** ** 00
     * 返回指定页码需要渲染的页码范围
     * @example
     * range(6) => [4, 9]
     */
    /**
     * Sets a page without effect
     */
    fit_page(page: number) {
      const next_view = _private_methods.view(page);
      if (!_initialized || _page !== page) {
        bus.emit(Events.Turning, { page, view: next_view });
        if (next_view.includes(1)) {
          bus.emit(Events.First);
        }
        if (next_view.includes(_page_count)) {
          bus.emit(Events.Last);
        }
      }
      if (!_pages_map[page]) {
        return;
      }
      _target_page = page;
      // _view = next_view;
      _private_methods.make_range();
      bus.emit(Events.Turned, { page, view: next_view });
    },
    turn_page(page: number) {
      let current = 0;
      let next = 0;
      const cur_view = [..._view];
      const next_view = _methods.view(page);
      bus.emit(Events.Turning, { page, view: next_view });
      if (next_view.includes(1)) {
        bus.emit(Events.First);
      }
      if (next_view.includes(_page_count)) {
        bus.emit(Events.Last);
      }
      _target_page = page;

      _private_methods.stop();
      _private_methods.make_range();

      if (_display === "single") {
        current = cur_view[0];
        next = next_view[0];
      } else if (cur_view[1] && page > cur_view[1]) {
        current = cur_view[1];
        next = next_view[0];
      } else if (cur_view[0] && page < cur_view[0]) {
        current = cur_view[0];
        next = next_view[1];
      }
      console.log("[BIZ]comic_book - turn_page - result", current, next);
      bus.emit(Events.Turned, { page, view: next_view });
    },
    in_range(page: number) {
      const range = _methods.range(_page);
      return page >= range[0] && page <= range[1];
    },
    set_page_loc(page: number) {
      const view = _methods.view();
      console.log("[BIZ]comic_book/index set_page_z", page, view);
      if (page === view[0] || page === view[1]) {
        // 在视图内
        _pages_map[page].methods.wrap_css({ "z-index": _page_count, display: "" });
        // data.pageWrap[page].css({ "z-index": data.totalPages, display: "" });
        return 1;
      } else if (
        (_display == "single" && page === view[0] + 1) ||
        (_display == "double" && page === view[0] - 2) ||
        page === view[1] + 2
      ) {
        _pages_map[page].methods.wrap_css({ "z-index": _page_count - 1, display: "" });
        // data.pageWrap[page].css({ "z-index": data.totalPages - 1, display: "" });
        return 2;
      }
      _pages_map[page].methods.wrap_css({ "z-index": 0, display: "none" });
      // data.pageWrap[page].css({ "z-index": 0, display: "none" });
      return 0;
    },
    stop() {
      if (_target_page) {
        _page = _target_page;
        _target_page = 0;
      }
      _methods.update();
    },
    flip() {},
    add_motion_page() {
      // var opts = $(this).data().f.opts,
      // turn = opts.turn,
      // dd = turn.data();
      // opts.pageMv = opts.page;
      // _private_methods._addMv(turn, opts.pageMv);
      // dd.pagePlace[opts.next] = opts.page;
      // turn.turn('update');
    },
    start(args: {
      event: { stopPropagation: () => void; preventDefault: () => void };
      flip: PageFlipEffect;
      corner: string;
    }) {
      const { event, flip, corner } = args;
      if (_display === "single") {
        const left = corner.charAt(1) === "l";
        if ((_page === 1 && left) || (_page === _page_count && !left)) {
          event.preventDefault();
        } else {
          if (left) {
            flip.methods.setNext(flip.next < flip.page ? flip.next : flip.page - 1);
          } else {
            flip.methods.setNext(flip.next > flip.page ? flip.next : flip.page + 1);
          }
        }
      }
      _private_methods.add_motion_page();
    },
    end(args: unknown) {},
    pressed(args: unknown) {},
    released(args: unknown) {},
    make_flip(page: number) {
      const single = _display == "single";
      const even = page % 2;
      // 创建 flip 实例准备翻页动画
      const flip = PageFlipEffect({
        $turn: result,
        page: page,
        next: single && page === _page_count ? page - 1 : even || single ? page + 1 : page - 1,
        duration: _props.duration,
        acceleration: _props.acceleration,
        corners: single ? "all" : even ? "forward" : "backward",
        backGradient: _props.gradients,
        frontGradient: _props.gradients,
      });
      flip.methods.disable(_props.disabled);
      flip.onFlip((e) => {
        console.log("[BIZ]comic_book/index make_flip - flip", e);
        _private_methods.flip();
      });
      flip.onStart((args) => {
        console.log("[BIZ]comic_book/index make_flip - start", args);
        _private_methods.start(args);
      });
      flip.onEnd((args) => {
        console.log("[BIZ]comic_book/index make_flip - end", args);
        _private_methods.end(args);
      });
      flip.onPressed((args) => {
        console.log("[BIZ]comic_book/index make_flip - pressed", args);
        _private_methods.pressed(args);
      });
      flip.onReleased((args) => {
        console.log("[BIZ]comic_book/index make_flip - released", args);
        _private_methods.released(args);
      });
      _pages_map[page].methods.css({
        "background-image": `linear-gradient(to ${single || page % 2 ? "left" : "right"}, #fff 90%, #ddd 100%)`,
      });
      //
    },
    /**  Adds a page from internal data */
    add_page(index: number) {
      // console.log("[BIZ]comic_book - add_page - index", index);
      if (!_pages_map[index]) {
        return;
      }
      const page = _pages_map[index];
      const size = {
        width: _display === "double" ? _size.width / 2 : _size.width,
        height: _size.height,
      };
      page.methods.css({
        width: `${size.width}px`,
        height: `${size.height}px`,
      });
      if (!page.methods.has_wrap_styles()) {
        page.methods.wrap_css({
          ...PageWrapStyleByPosition[_display === "double" ? index % 2 : 0],
          position: "absolute",
          overflow: "hidden",
          width: `${size.width}px`,
          height: `${size.height}px`,
        });
      }
      const range = _methods.range();
      console.log("[BIZ]comic_book/index add_page - before in_range", index, range);
      if (_private_methods.in_range(index)) {
        const tag = _private_methods.set_page_loc(index);
        if (!index || tag === 1) {
          _private_methods.make_flip(index);
        }
      }
    },
    make_range() {
      const range = _methods.range();
      console.log("[BIZ]comic_book/index make_range - before", range, _initialized);
      for (let page = range[0]; page <= range[1]; page++) {
        _private_methods.add_page(page);
      }
    },
  };
  const _methods = {
    initialize() {
      _methods.page(_page);
      _initialized = true;
    },
    addPage(page: ComicBookPage<T>, index: number) {
      let inc_page = false;
      let last_page = _page_count + 1;
      if (index) {
        if (index === last_page) {
          index = last_page;
          inc_page = true;
        } else if (index > last_page) {
          throw new Error("index 不能大于 _page_count");
        }
      } else {
        index = last_page;
        inc_page = true;
      }
      if (index >= 1 && index <= last_page) {
        if (index in _pages_map) {
          // move page?
        }
        if (inc_page) {
          _page_count = last_page;
        }
        _pages_map[index] = page;
        //       page.methods.setSize(_size);
        _private_methods.add_page(index);
        // console.log("[BIZ]comic_book/index addPage - before _initialized", _initialized);
        // if (_initialized) {
        //   _methods.update();
        // }
      }
    },
    view(page?: number) {
      const next_page = page || _page;
      const view = _private_methods.view(next_page);
      if (_display == "double") {
        _view = [view[0] > 0 ? view[0] : 0, view[1] <= _page_count ? view[1] : 0];
        return _view;
      }
      _view = [view[0] > 0 && view[0] <= _page_count ? view[0] : 0];
      return _view;
    },
    // range(page: number) {
    //   return _private_methods.range(page);
    // },
    range(page?: number) {
      const next_page = page || _target_page || _page;
      if (next_page < 1 || next_page > _page_count) {
        return [];
      }
      const view = _private_methods.view(next_page);
      view[1] = view[1] || view[0];
      let left = PageCountPrerender - 1;
      let right = PageCountPrerender - 1;
      if (view[0] >= 1 && view[1] <= _page_count) {
        const remaining_pages = Math.floor((PageCountPrerender - 2) / 2);
        if (_page_count - view[1] > view[0]) {
          left = Math.min(view[0] - 1, remaining_pages);
          right = 2 * remaining_pages - left;
        } else {
          right = Math.min(_page_count - view[1], remaining_pages);
          left = 2 * remaining_pages - right;
        }
      }
      _range = [Math.max(1, view[0] - left), Math.min(_page_count, view[1] + right)];
      return _range;
    },
    update() {
      _view = _private_methods.view(_page);
      Object.keys(_pages_map).forEach((index) => {
        _private_methods.set_page_loc(Number(index));
      });
    },
    refresh() {
      bus.emit(Events.StateChange, { ..._state });
    },
    prev() {
      const cur_view = [..._view];
      const next_page = cur_view[0] - 1;
      _methods.page(next_page);
      bus.emit(Events.StateChange, { ..._state });
    },
    next() {
      // const cur_view = _private_methods.view(_page);
      const cur_view = [..._view];
      const next_page = cur_view[cur_view.length - 1] + 1;
      _methods.page(next_page);
      bus.emit(Events.StateChange, { ..._state });
    },
    /** 翻到指定页 */
    page(page: number) {
      console.log("[BIZ]comic_book/index page - before", page, _page_count);
      if (page <= 0 || page > _page_count) {
        return;
      }
      console.log("[BIZ]comic_book/index page - before _view.includes", _initialized, _view);
      if (!_initialized || _view.includes(page)) {
        console.log("[BIZ]comic_book - before fit_page", page);
        _private_methods.fit_page(page);
      } else {
        console.log("[BIZ]comic_book - before turn_page", page);
        _private_methods.turn_page(page);
      }
      _page = page;
    },
    existing(page: number) {
      return !!_pages_map[page];
    },
    setSize(size: { width: number; height: number }) {
      _size = size;
    },
  };
  const _state = {
    get pages() {
      return Object.values(_pages_map);
    },
    get width() {
      return _size.width;
    },
    get height() {
      return _size.height;
    },
    get view() {
      return _view;
    },
    get range() {
      return _range;
    },
  };
  enum Events {
    /** 开始翻页 */
    Turning,
    /** 翻页完成 */
    Turned,
    /** 第一页 */
    First,
    /** 最后一页 */
    Last,
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Turning]: { page: number; view: number[] };
    [Events.Turned]: { page: number; view: number[] };
    [Events.First]: void;
    [Events.Last]: void;
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();
  //   _methods.page(_page);
  //   _initialized = true;
  const result = {
    state: _state,
    methods: _methods,
    get initialized() {
      return _initialized;
    },
    get display() {
      return _display;
    },
    get pages() {
      return _pages_map;
    },
    onStateChange: (handler: Handler<TheTypesOfEvents[Events.StateChange]>) => {
      bus.on(Events.StateChange, handler);
    },
    onTurning: (handler: Handler<TheTypesOfEvents[Events.Turning]>) => {
      bus.on(Events.Turning, handler);
    },
    onTurned: (handler: Handler<TheTypesOfEvents[Events.Turned]>) => {
      bus.on(Events.Turned, handler);
    },
    onFirst: (handler: Handler<TheTypesOfEvents[Events.First]>) => {
      bus.on(Events.First, handler);
    },
    onLast: (handler: Handler<TheTypesOfEvents[Events.Last]>) => {
      bus.on(Events.Last, handler);
    },
  };
  return result;
}

export type ComicBook<T extends any> = ReturnType<typeof ComicBook<T>>;
