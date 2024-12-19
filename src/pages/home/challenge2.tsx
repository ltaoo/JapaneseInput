import { createSignal, For, Show } from "solid-js";
import { ChevronRight, Eraser, Eye, File, Info, Lightbulb, Loader, Mic, ScanText, Upload } from "lucide-solid";

import { base, Handler } from "@/domains/base";
import { ViewComponentProps } from "@/store/types";
import { AudioCore } from "@/domains/audio";
import { shuffleArray } from "@/utils";
import { Audio } from "@/components/ui/audio";
import { JapaneseInput, JapaneseInputCore } from "@/components/JapaneseInput";
import { Button } from "@/components/ui";
import { ButtonCore } from "@/domains/ui";

type JPWord = {
  /** 平假名 */
  kana: string;
  /** 罗马字 */
  luoma: string;
  /** 日语单词 */
  word: string;
  /** 中文释义 */
  meaning: string;
};
function WordChallenge(props: { app: ViewComponentProps["app"]; kana: JPWord[] }) {
  let _questions = shuffleArray(props.kana);
  let _index = 0;
  let _total = _questions.length;

  function submit() {
    const value = $input.value;
    console.log("click btn", value);
    if (!value) {
      return;
    }
    if (!state.cur.kana) {
      return;
    }
    if (value === state.cur.kana) {
      $input.clear();
      $input.focus();
      next();
      return;
    }
    console.log("incorrect", value, state.cur.kana);
  }

  const $input = JapaneseInputCore({ app: props.app });
  const $submit = new ButtonCore({
    onClick() {
      submit();
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

  function play() {}
  function next() {
    _index += 1;
    if (!state.cur) {
      bus.emit(Events.Completed);
      return;
    }
    play();
    bus.emit(Events.Change, { ...state });
  }
  $input.onEnter(() => {
    submit();
  });

  return {
    $input,
    $submit,
    $audio,
    state,
    tip() {
      props.app.tip({
        text: [state.cur.luoma],
      });
    },
    next,
    play,
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export function WordChallengePage(props: ViewComponentProps) {
  const $challenge = WordChallenge({
    app: props.app,
    kana: [
      {
        kana: "あお",
        luoma: "ao",
        word: "青",
        meaning: "蓝色，青色，绿色",
      },
      {
        kana: "あか",
        luoma: "aka",
        word: "赤",
        meaning: "红色",
      },
      {
        kana: "あき",
        luoma: "aki",
        word: "秋",
        meaning: "秋天",
      },
      {
        kana: "あさ",
        luoma: "asa",
        word: "朝",
        meaning: "早上，早晨",
      },
      {
        kana: "あさごはん",
        luoma: "asa",
        word: "朝ご飯",
        meaning: "早饭",
      },
      {
        kana: "あさって",
        luoma: "asatte",
        word: "あさって",
        meaning: "后天",
      },
      {
        kana: "あし",
        luoma: "ashi",
        word: "足",
        meaning: "脚，腿",
      },
      {
        kana: "あした",
        luoma: "ashita",
        word: "明日",
        meaning: "明天",
      },
      {
        kana: "あたま",
        luoma: "atama",
        word: "頭",
        meaning: "头，脑袋",
      },
      {
        kana: "あと",
        luoma: "ato",
        word: "後",
        meaning: "后面，后方；以后",
      },
      {
        kana: "あに",
        luoma: "ani",
        word: "兄",
        meaning: "哥哥",
      },
      {
        kana: "あね",
        luoma: "ane",
        word: "姉",
        meaning: "姐姐",
      },
      {
        kana: "あめ",
        luoma: "ame",
        word: "雨",
        meaning: "雨",
      },
      {
        kana: "あめ",
        luoma: "ame",
        word: "飴",
        meaning: "糖，饴糖",
      },
      {
        kana: "いえ",
        luoma: "ie",
        word: "家",
        meaning: "房屋；家，家庭",
      },
    ],
  });

  const [recognize, setRecognize] = createSignal($challenge.$input.state);
  const [question, setQuestion] = createSignal($challenge.state);

  $challenge.$input.onChange((v) => setRecognize(v));
  $challenge.onChange((v) => setQuestion(v));

  return (
    <div class="relative h-full pt-2">
      <div class="flex justify-center mt-8">
        <div class="text-3xl">{question().cur.meaning}</div>
        <Audio store={$challenge.$audio} />
      </div>
      <div class="w-[210px] mx-auto mt-8">
        <div class="relative flex space-x-2 w-[210px]">
          <JapaneseInput class="relative w-full h-full" store={$challenge.$input} />
          <Button store={$challenge.$submit}>确定</Button>
        </div>
      </div>
      <div class="absolute right-8 top-8">
        <div class="flex space-x-2 rounded-md bg-gray-100">
          <div class="p-4">
            <Lightbulb class="w-6 w-6" />
          </div>
          <div class="p-4">
            <File class="w-6 w-6" />
          </div>
          <div class="p-4">
            <Upload class="w-6 w-6" />
          </div>
          <div class="p-4">
            <Info class="w-6 w-6" />
          </div>
        </div>
      </div>
      <div class="absolute left-1/2 bottom-8 py-8 w-[960px] -translate-x-1/2">
        <div class="mt-8">
          <div class="relative w-full h-[8px]">
            <div class="w-full h-full bg-gray-200"></div>
            <div class="absolute left-0 top-0 h-full bg-green-500" style={{ width: `${question().progress}%` }}></div>
            <div>
              {question().index}/{question().total}
            </div>
          </div>
        </div>
        <div class="flex space-x-4 mt-8"></div>
      </div>
    </div>
  );
}
