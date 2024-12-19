import { AudioCore } from "./index";

export function connect(store: AudioCore, $audio: HTMLAudioElement) {
  //   audio.referrerPolicy = "no-referrer";
  if (store.url) {
    $audio.src = store.url;
  }
  $audio.addEventListener("canplay", () => {
    store.handleCanplay();
  });
  $audio.addEventListener("play", () => {
    store.setPlaying(true);
  });
  $audio.addEventListener("pause", () => {
    store.setPlaying(false);
  });
  $audio.addEventListener("ended", () => {
    store.handleEnded();
  });
  $audio.addEventListener("timeupdate", () => {
    store.handleTimeUpdate({ currentTime: parseFloat($audio.currentTime.toFixed(2)) });
  });
  $audio.addEventListener("stop", (e) => {
    store.handleStop();
  });
  //   $audio.addEventListener("error", (e) => {});
  store.play = () => {
    store.beforePlay();
    $audio.play();
//     setTimeout(() => {
//       console.log("wx", $audio.paused);
//     }, 500);
  };
  store.pause = () => {
    $audio.pause();
  };
  store.stop = () => {
    console.log("[BIZ]audio/connect - stop");
    //     $audio.stop();
  };
  store.seek = (v: number) => {
    console.log("[BIZ]audio/connect - seek", v);
    //     $audio.seek(v);
    // audio.startTime = v;
  };
  store.destroy = () => {
    console.log("[BIZ]audio/connect - destroy");
    //     $audio.destroy();
  };
  store.setURL = (url: string) => {
    $audio.src = url;
  };
  store.setVolume = (v: number) => {
    $audio.volume = v;
  };
}
