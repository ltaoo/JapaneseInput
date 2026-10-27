import { connect } from "@/domains/ui/input/connect.web";

/** Legacy input cores retain the input method's selection and focus contract. */
export function TextField({ store, name, multiline = false, ...props }) {
  const state_ = ref({ ...store.state });
  const off = store.onStateChange(() => state_.as({ ...store.state }));
  const Component = multiline ? Timeless.Textarea : Timeless.Input;
  return Component({
    ...props,
    class: `study-input ${multiline ? "study-textarea" : ""} ${props.class || ""}`,
    value: computed(state_, (s) => s.value),
    placeholder: computed(state_, (s) => s.placeholder),
    disabled: computed(state_, (s) => s.disabled),
    type: store.type === "string" ? "text" : store.type,
    attributes: { n: name, "data-n": name, "aria-label": props.label || store.placeholder, ...props.attributes },
    onInput(event) { store.setValue(event.target.value); },
    onFocus() { store.handleFocus(); },
    onBlur() { store.handleBlur(); },
    onMounted(event) {
      const element = event.target.get$elm();
      connect(store, element);
      props.onMounted?.(element);
    },
    onUnmounted() { off(); props.onUnmounted?.(); },
  });
}

export function Action({ name, store, ...props }, children) {
  return Button({ ...props, class: `study-button ${props.class || ""}`, store, attributes: { n: name, "data-n": name, type: "button", ...props.attributes } }, children);
}
