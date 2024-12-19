import { onMount } from "solid-js";

import { AudioCore } from "@/domains/audio";
import { connect } from "@/domains/audio/connect.web";

export function Audio(props: { store: AudioCore }) {
  const { store } = props;

  let $audio: undefined | HTMLAudioElement;

  onMount(() => {
    if (!$audio) {
      return;
    }
    connect(store, $audio);
  });

  return (
    <div>
      <audio ref={$audio} controls={false} />
    </div>
  );
}
