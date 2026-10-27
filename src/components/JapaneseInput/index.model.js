/** @param {{store: import('@/biz/japanese_input').JapaneseInputCore}} props */
export function JapaneseInputModel({ store }) {
  return {
    store,
    keydown(event) {
      return store.handleKeydown({ key: event.key, code: event.code, preventDefault() { event.preventDefault(); } });
    },
    keyup(event) { store.handleKeyup({ key: event.key }); },
    popupStyle(state) {
      return { "z-index": 9999, left: `${state.popup.x}px`, top: `${state.popup.y}px` };
    },
    panelStyle(state) {
      return { right: state.popup.h === "left" ? "0px" : "auto", bottom: state.popup.v === "up" ? "0px" : "auto" };
    },
  };
}
