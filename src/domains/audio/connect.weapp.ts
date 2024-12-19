import { AudioCore } from "./index";

export function connect(store: AudioCore) {
  // @ts-ignore
  const audio = wx.createInnerAudioContext({});
  audio.referrerPolicy = "no-referrer";
  if (store.url) {
    audio.src = store.url;
  }
  audio.onCanplay(() => {
    store.handleCanplay();
  });
  audio.onEnded(() => {
    store.handleEnded();
  });
  audio.onPlay(() => {
    store.setPlaying(true);
  });
  audio.onStop(() => {
    store.handleStop();
  });
  audio.onTimeUpdate(() => {
    store.handleTimeUpdate({ currentTime: audio.currentTime });
  });
  audio.onPause(() => {
    store.setPlaying(false);
  });
  store.play = () => {
    store.beforePlay();
    audio.play();
    setTimeout(() => {
      console.log("wx", audio.paused);
    }, 500);
  };
  store.pause = () => {
    audio.pause();
  };
  store.stop = () => {
    console.log("[BIZ]audio/connect - stop");
    audio.stop();
  };
  store.seek = (v: number) => {
    console.log("[BIZ]audio/connect - seek", v);
    audio.seek(v);
    // audio.startTime = v;
  };
  store.destroy = () => {
    console.log("[BIZ]audio/connect - destroy");
    audio.destroy();
  };
  store.setURL = (url: string) => {
    audio.src = url;
  };
  store.setVolume = (v: number) => {
    audio.volume = v;
  };
}
