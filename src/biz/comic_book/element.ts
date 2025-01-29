import { base, Handler } from "@/domains/base";

type ElementJQueryLikeCoreProps = {
  class?: string;
  tag: string;
  parent: null | ElementJQueryLikeCore;
  children?: ElementJQueryLikeCore[];
};

export type TreeNode = {
  tag: string;
  children: TreeNode[] | null;
};
type TheElementInterface = {
  css: (styles: Partial<{ [key: string]: string }>) => void;
  transform: (transform: string) => void;
};

export function ElementJQueryLikeCore(props: ElementJQueryLikeCoreProps) {
  let _mounted = false;
  let _width = 0;
  let _height = 0;
  let _styles: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    "transform-origin"?: string;
    transform?: string;
    "background-image"?: string;
  } = {
    // "background-image": "linear-gradient(to left, #fff 95%, #ddd 100%)",
  };
  let _parent = props.parent;
  let _children: ElementJQueryLikeCore[] = props.children || [];
  let _elm: TheElementInterface | null = null;

  const _methods = {
    width() {
      return _width;
    },
    height() {
      return _height;
    },
    transform(transform: string, origin?: string) {
      const properties: { "transform-origin"?: string; transform?: string } = {};
      if (origin) {
        properties["transform-origin"] = origin;
      }
      properties["transform"] = transform;
      _methods.css(properties);
    },
    css(styles: Partial<typeof _styles>) {
      console.log("[BIZ]comic_book/element css", _elm, styles);
      if (!_elm) {
        _styles = {
          ..._styles,
          ...styles,
        };
        // console.warn("请先调用 bind 方法");
        return;
      }
      _elm.css(styles);
      //       _styles = {
      //         ..._styles,
      //         ...styles,
      //       };
    },
    parent() {
      return props.parent;
    },
  };
  const _state = {
    get tag() {
      return props.tag;
    },
    get children(): TreeNode[] | null {
      return props.children ? props.children.map((child) => child.state) : null;
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
    //     parent: _methods.parent,
    //     width: _methods.width,
    //     height: _methods.height,
    css: _methods.css,
    transform: _methods.transform,
    parent() {
      return _parent;
    },
    append(child: any) {
      _children.push(child);
    },
    bind(node: TheElementInterface) {
      if (_mounted) {
        return;
      }
      _elm = node;
      _mounted = true;
      _methods.css(_styles);
    },
    refresh(info: {}) {},
    width() {
      return _width;
    },
    height() {
      return _height;
    },
    children() {
      return _children;
    },
    onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
      bus.on(Events.StateChange, handler);
    },
  };
}

export type ElementJQueryLikeCore = ReturnType<typeof ElementJQueryLikeCore>;
