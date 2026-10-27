import { connect } from "@/domains/audio/connect.web";

export function AudioView({ store }) {
  return Timeless.Audio({
    attributes: { n: "pronunciation-audio", "data-n": "pronunciation-audio" },
    onMounted(event) { connect(store, event.target.get$elm()); },
    onUnmounted() { store.pause(); },
  });
}
