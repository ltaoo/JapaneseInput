import { base, Handler } from "@/domains/base";

function timeStrToSeconds(durationStr: string) {
  if (durationStr.match(/[0-9]{1,2}:[0-9]{2}:[0-9]{2}[\.,]/)) {
    const timeParts = durationStr.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseFloat(timeParts[2].replace(",", ".")); // 处理逗号分隔的秒和毫秒部分
    return parseFloat((hours * 60 * 60 + minutes * 60 + seconds).toFixed(2));
  }
  if (durationStr.match(/[0-9]{2}:[0-9]{2}[\.,]/)) {
    const timeParts = durationStr.split(":");
    const minutes = parseInt(timeParts[0]);
    const seconds = parseFloat(timeParts[1].replace(",", ".")); // 处理逗号分隔的秒和毫秒部分
    return parseFloat((minutes * 60 + seconds).toFixed(2));
  }
  return 0;
}

export function AudioCore(props: Partial<{ url: string }> = {}) {
  const { url } = props;
  let _url = url;
  /** 缓冲中 */
  let _buffer = false;
  let _canplay = false;
  let _ended = false;
  let _playing = false;
  let _range: [number, number] | null = null;
  const _state = {
    get canplay() {
      return _canplay;
    },
    get playing() {
      return _playing;
    },
    get ended() {
      return _ended;
    },
  };
  enum Events {
    Canplay,
    Ended,
    Play,
    TimeUpdate,
    Pause,
    Stop,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Canplay]: void;
    [Events.Ended]: void;
    [Events.Play]: void;
    [Events.TimeUpdate]: void;
    [Events.Pause]: void;
    [Events.Stop]: void;
    [Events.Change]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    SymbolTag: "AudioCore" as const,
    state: _state,
    get url() {
      return _url;
    },
    play() {
      console.log("请实现 play 方法");
    },
    pause() {
      console.log("请实现 pause 方法");
    },
    toggle() {
      if (!_canplay) {
        return;
      }
      if (_playing) {
        this.pause();
        return;
      }
      this.play();
    },
    stop() {
      console.log("请实现 stop 方法");
    },
    seek(seconds: number) {
      console.log("请实现 seek 方法");
    },
    destroy() {
      console.log("请实现 destroy 方法");
    },
    setURL(v: string) {
      console.log("请实现 setURL 方法");
    },
    setVolume(v: number) {
      console.log("请实现 setVolume 方法");
    },
    setPlaying(v: boolean) {
      _playing = v;
      (() => {
        if (v) {
          bus.emit(Events.Play);
          return;
        }
        bus.emit(Events.Pause);
      })();
      bus.emit(Events.Change, { ..._state });
    },
    handleStop() {
      _playing = false;
      bus.emit(Events.Stop);
    },
    setRange(range: (string | number)[]) {
      if (range.length === 0) {
        return;
      }
      const [start, end] = range;
      _range = (() => {
        if (typeof start === "string" && typeof end === "string") {
          return [timeStrToSeconds(start) - 1, timeStrToSeconds(end) + 1];
        }
        if (typeof start === "number" && typeof end === "number") {
          return [start - 1, end + 1];
        }
        return null;
      })();
    },
    beforePlay() {
      console.log("[BIZ]audio/index - beforePlay", _range);
      if (_range !== null) {
        this.seek(_range[0]);
      }
    },
    handleCanplay() {
      _canplay = true;
      bus.emit(Events.Canplay);
      bus.emit(Events.Change, { ..._state });
    },
    handleEnded() {
      _ended = true;
      bus.emit(Events.Ended);
      bus.emit(Events.Change, { ..._state });
    },
    handleTimeUpdate(values: { currentTime: number }) {
      bus.emit(Events.TimeUpdate);
      if (_range !== null) {
        if (values.currentTime >= _range[1]) {
          this.pause();
        }
      }
    },
    onCanplay(handler: Handler<TheTypesOfEvents[Events.Canplay]>) {
      return bus.on(Events.Canplay, handler);
    },
    onStop(handler: Handler<TheTypesOfEvents[Events.Stop]>) {
      return bus.on(Events.Stop, handler);
    },
    onTimeUpdate(handler: Handler<TheTypesOfEvents[Events.TimeUpdate]>) {
      return bus.on(Events.TimeUpdate, handler);
    },
    onEnded(handler: Handler<TheTypesOfEvents[Events.Ended]>) {
      return bus.on(Events.Ended, handler);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export type AudioCore = ReturnType<typeof AudioCore>;
