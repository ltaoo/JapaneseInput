/** Preserve mounted pages and their models when navigating between siblings. */
export function RouteView({ store, index, children }) {
  const state_ = ref({ ...store.$presence.state });
  const off = store.$presence.onStateChange(() => state_.as({ ...store.$presence.state }));
  store.ready();
  return View({
    attributes: { n: "route-page", "data-n": "route-page", "data-href": store.href },
    class: "absolute inset-0",
    style: { "z-index": index, display: computed(state_, (s) => s.visible ? "block" : "none") },
    onMounted() { store.setShow(); },
    onUnmounted() { off(); store.setUnmounted(); store.destroy(); },
  }, children);
}
