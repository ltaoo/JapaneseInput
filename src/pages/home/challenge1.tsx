import { createSignal, For, Show } from "solid-js";
import { ChevronRight, Eraser, Eye, Info, Lightbulb, Loader, Mic, ScanText, Settings } from "lucide-solid";

import { base, Handler } from "@/domains/base";
import { ViewComponentProps } from "@/store/types";
import { CanvasCore } from "@/biz/canvas";
import { RecognizeCore } from "@/biz/recognize";
import { Gojūon_in_sort1, JPChar } from "@/biz/japanese_input/constants";
import { AudioCore } from "@/domains/audio";
import { HiraganaCanvas } from "@/components/HiraganaCanvas";
import { shuffleArray, sleep } from "@/utils";
import { Audio } from "@/components/ui/audio";
import { KanaCore } from "@/biz/kana";

function HiraganaChallenge(props: { app: ViewComponentProps["app"]; kana: JPChar[] }) {
  const { app } = props;

  let _questions = shuffleArray(props.kana);
  let _index = 0;
  let _total = _questions.length;
  let _correct: boolean | null = null;

  const $canvas = CanvasCore({});
  const $recognize = RecognizeCore({
    app,
    $canvas,
    async onSubmit(v) {
      console.log("input", v.text);
      if (v.text === state.cur.hiragana) {
        _correct = true;
        bus.emit(Events.Change, { ...state });
        await sleep(2000);
        $recognize.clear();
        next();
        return;
      }
      _correct = false;
      bus.emit(Events.Change, { ...state });
    },
  });
  const $audio = AudioCore({});

  const state = {
    get cur() {
      return _questions[_index];
    },
    get index() {
      return _index + 1;
    },
    get correct() {
      return _correct;
    },
    get total() {
      return _total;
    },
    get progress() {
      return (_index / _total) * 100;
    },
  };

  enum Events {
    Completed,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Completed]: void;
    [Events.Change]: typeof state;
  };

  const bus = base<TheTypesOfEvents>();

  function play() {
    const $ins = KanaCore(state.cur);
    const voice = $ins.voice();
    if (!voice) {
      props.app.tip({
        text: ["没有找到音频文件"],
      });
      return;
    }
    $audio.setURL(voice);
    $audio.play();
  }
  function next() {
    _index += 1;
    _correct = null;
    if (!state.cur) {
      bus.emit(Events.Completed);
      return;
    }
    play();
    bus.emit(Events.Change, { ...state });
  }

  return {
    $recognize,
    $audio,
    state,
    tip() {
      props.app.tip({
        text: [state.cur.hiragana],
      });
    },
    next,
    play,
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export function HiraganaChallengePage(props: ViewComponentProps) {
  const $challenge = HiraganaChallenge({ app: props.app, kana: Gojūon_in_sort1.filter((c) => !c.placeholder) });

  const [recognize, setRecognize] = createSignal($challenge.$recognize.state);
  const [state, setState] = createSignal($challenge.state);

  $challenge.$recognize.onChange((v) => setRecognize(v));
  $challenge.onChange((v) => setState(v));

  return (
    <div class="relative h-full pt-8">
      <div class="flex justify-center">
        <div
          class="inline-flex items-center justify-center p-4 rounded-full bg-gray-300 cursor-pointer"
          onClick={() => {
            $challenge.play();
          }}
        >
          <Mic class="w-24 h-24 text-gray-800" />
        </div>
        <Audio store={$challenge.$audio} />
      </div>
      <div class="w-[210px] mx-auto mt-8">
        <div class="relative w-[210px] h-[210px]">
          <HiraganaCanvas class="relative w-full h-full" store={$challenge.$recognize} />
        </div>
        <div class="flex justify-center mt-4">
          <div class="flex space-x-2">
            <div
              class="p-2 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={() => {
                $challenge.$recognize.recognize();
              }}
            >
              <Show
                when={!recognize().pending}
                fallback={<Loader class="w-8 h-8 text-gray-600 animate animate-spin" />}
              >
                <ScanText class="w-8 h-8 text-gray-600" />
                <div class="mt-1 text-sm">识别</div>
              </Show>
            </div>
            <div
              class="p-2 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={() => {
                $challenge.$recognize.clear();
              }}
            >
              <Eraser class="w-8 h-8 text-gray-600" />
              <div class="mt-1 text-sm">清除</div>
            </div>
          </div>
        </div>
        <Show when={recognize().text}>
          <div
            classList={{
              "mt-12 text-center text-4xl": true,
              "text-green-500": state().correct === true,
              "text-red-500": state().correct === false,
            }}
          >
            {recognize().text}
          </div>
          <div class="mt-2 text-center">
            <Show when={state().correct === true}>正确</Show>
            <Show when={state().correct === false}>错误</Show>
          </div>
        </Show>
      </div>
      <div class="absolute right-8 top-8">
        <div class="flex space-x-2 rounded-md bg-gray-100">
          <div
            class="p-4 cursor-pointer"
            onClick={() => {
              $challenge.tip();
            }}
          >
            <Lightbulb class="w-6 w-6" />
          </div>
          {/* <div class="p-4">
            <Settings class="w-6 w-6" />
          </div> */}
        </div>
      </div>
      <div class="absolute left-0 bottom-8 w-full">
        <div class="max-w-[960px] mx-auto py-8">
          <div class="mt-8">
            <div class="relative w-full h-[8px]">
              <div class="w-full h-full bg-gray-200"></div>
              <div class="absolute left-0 top-0 h-full bg-green-500" style={{ width: `${state().progress}%` }}></div>
              <div>
                {state().index}/{state().total}
              </div>
            </div>
          </div>
          {/* <div class="flex space-x-4 mt-8">
            <div
              class=""
              onClick={() => {
                $challenge.next();
              }}
            >
              <div class="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 cursor-pointer hover:bg-gray-200">
                <ChevronRight class="w-12 h-12" />
              </div>
            </div>
            <div
              class=""
              onClick={() => {
                $challenge.tip();
              }}
            >
              <div class="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 cursor-pointer hover:bg-gray-200">
                <Info class="w-12 h-12" />
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
