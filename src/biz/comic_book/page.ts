import { base, Handler } from "@/domains/base";
import { ElementJQueryLikeCore } from "./element";

type ComicBookPageProps<T> = {
  page: number;
  payload: T;
};

export function ComicBookPage<T>(props: ComicBookPageProps<T>) {
  let _size = { width: 0, height: 0 };
  let _styles = {
    // "background-image": "linear-gradient(to left, #fff 95%, #ddd 100%)",
  };
  let _wrap_styles = {};
  let _wrap = ElementJQueryLikeCore({ parent: null, tag: "div", class: "wrap", children: [] });
  let _page = ElementJQueryLikeCore({ parent: _wrap, tag: "div", class: "page" });
  _wrap.append(_page);

  const _methods = {
    has_wrap_styles() {
      return Object.keys(_wrap_styles).length > 0;
    },
    wrap_css(styles: Partial<typeof _wrap_styles>) {
      _wrap.css(styles);
      // _wrap_styles = {
      //   ..._wrap_styles,
      //   ...styles,
      // };
      bus.emit(Events.StateChange, { ..._state });
    },
    css(styles: Partial<typeof _styles>) {
      console.log("[BIZ]comic_book/page css", styles);
      _page.css(styles);
      // _styles = {
      //   ..._styles,
      //   ...styles,
      // };
      // console.log("[BIZ]comic_book/page css", _styles);
      bus.emit(Events.StateChange, { ..._state });
    },
    transform(transform: string, origin?: string) {
      _page.transform(transform, origin);
    },
    setSize(size: { width: number; height: number }) {
      _size = size;
    },
  };
  const _state = {
    get page() {
      return props.page;
    },
    get styles() {
      return _styles;
    },
    get wrapStyles() {
      return _wrap_styles;
    },
    get payload() {
      return props.payload;
    },
  };
  enum Events {
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();
  return {
    state: _state,
    methods: _methods,
    $wrap: _wrap,
    $page: _page,
    onStateChange: (handler: Handler<TheTypesOfEvents[Events.StateChange]>) => {
      bus.on(Events.StateChange, handler);
    },
  };
}

export type ComicBookPage<T> = ReturnType<typeof ComicBookPage<T>>;
