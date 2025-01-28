import { base, Handler } from "@/domains/base";

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
  const _methods = {
    has_wrap_styles() {
      return Object.keys(_wrap_styles).length > 0;
    },
    wrap_css(styles: Partial<typeof _wrap_styles>) {
      _wrap_styles = {
        ..._wrap_styles,
        ...styles,
      };
      bus.emit(Events.StateChange, { ..._state });
    },
    css(styles: Partial<typeof _styles>) {
      _styles = {
        ..._styles,
        ...styles,
      };
      // console.log("[BIZ]comic_book/page css", _styles);
      bus.emit(Events.StateChange, { ..._state });
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
    onStateChange: (handler: Handler<TheTypesOfEvents[Events.StateChange]>) => {
      bus.on(Events.StateChange, handler);
    },
  };
}

export type ComicBookPage<T> = ReturnType<typeof ComicBookPage<T>>;
