import { createSignal, For, Show } from "solid-js";
import { ChevronRight, Eraser, Eye, File, Info, Lightbulb, Loader, Mic, ScanText, Upload } from "lucide-solid";

import { ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { ButtonCore } from "@/domains/ui";
import { AudioCore } from "@/domains/audio";
import { JapaneseInputCore } from "@/biz/japanese_input";
import { Audio } from "@/components/ui/audio";
import { JapaneseInput } from "@/components/JapaneseInput";
import { Button } from "@/components/ui";
import { shuffleArray } from "@/utils";

type JPWord = {
  /** 平假名 */
  hiragana: string;
  /** 罗马字 */
  romaji: string;
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
    if (!state.cur.hiragana) {
      return;
    }
    if (value === state.cur.hiragana) {
      $input.clear();
      $input.focus();
      next();
      return;
    }
    console.log("incorrect", value, state.cur.hiragana);
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
        text: [state.cur.romaji],
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
        hiragana: "あお",
        romaji: "ao",
        word: "青",
        meaning: "蓝色，青色，绿色",
      },
      {
        hiragana: "あか",
        romaji: "aka",
        word: "赤",
        meaning: "红色",
      },
      {
        hiragana: "あき",
        romaji: "aki",
        word: "秋",
        meaning: "秋天",
      },
      {
        hiragana: "あさ",
        romaji: "asa",
        word: "朝",
        meaning: "早上，早晨",
      },
      {
        hiragana: "あさごはん",
        romaji: "asa",
        word: "朝ご飯",
        meaning: "早饭",
      },
      {
        hiragana: "あさって",
        romaji: "asatte",
        word: "あさって",
        meaning: "后天",
      },
      {
        hiragana: "あし",
        romaji: "ashi",
        word: "足",
        meaning: "脚，腿",
      },
      {
        hiragana: "あした",
        romaji: "ashita",
        word: "明日",
        meaning: "明天",
      },
      {
        hiragana: "あたま",
        romaji: "atama",
        word: "頭",
        meaning: "头，脑袋",
      },
      {
        hiragana: "あと",
        romaji: "ato",
        word: "後",
        meaning: "后面，后方；以后",
      },
      {
        hiragana: "あに",
        romaji: "ani",
        word: "兄",
        meaning: "哥哥",
      },
      {
        hiragana: "あね",
        romaji: "ane",
        word: "姉",
        meaning: "姐姐",
      },
      {
        hiragana: "あめ",
        romaji: "ame",
        word: "雨",
        meaning: "雨",
      },
      {
        hiragana: "あめ",
        romaji: "ame",
        word: "飴",
        meaning: "糖，饴糖",
      },
      {
        hiragana: "いえ",
        romaji: "ie",
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
          <div
            class="p-4 cursor-pointer"
            onClick={() => {
              $challenge.tip();
            }}
          >
            <Lightbulb class="w-6 w-6" />
          </div>
          {/* <div class="p-4">
            <File class="w-6 w-6" />
          </div>
          <div class="p-4">
            <Upload class="w-6 w-6" />
          </div>
          <div class="p-4">
            <Info class="w-6 w-6" />
          </div> */}
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
