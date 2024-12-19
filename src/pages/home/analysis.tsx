import { createSignal, For, Show } from "solid-js";

import { ViewComponentProps } from "@/store/types";
import { Button, Textarea } from "@/components/ui";
import { base, Handler } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";

const data1 = {
  texts: [
    {
      text: "以下",
      kana: "いか",
      start: 0,
      end: 2,
      meaning: "以下，以下的内容",
      desc: "表示接下来要提到的内容或结果",
      type: "名词",
    },
    { text: "で", kana: "で", start: 2, end: 3, meaning: "通过，用", desc: "表示手段或方法的助词", type: "助词" },
    {
      text: "実現",
      kana: "じつげん",
      start: 3,
      end: 5,
      meaning: "实现，达成",
      desc: "表示某个目标的达到或完成",
      type: "名词",
    },
    {
      text: "できた",
      kana: "できた",
      start: 5,
      end: 8,
      meaning: "能够做到，完成",
      desc: "表示过去时态，表示已经完成某个动作",
      type: "动词",
    },
    {
      text: "ので",
      kana: "ので",
      start: 8,
      end: 10,
      meaning: "因为，由于",
      desc: "表示原因或理由的连接词",
      type: "助词",
    },
    {
      text: "本書",
      kana: "ほんしょ",
      start: 10,
      end: 12,
      meaning: "本书，这本书",
      desc: "指代前文提到的书籍",
      type: "名词",
    },
    {
      text: "を",
      kana: "を",
      start: 12,
      end: 13,
      meaning: "表示宾语的助词",
      desc: "用于表示动作的直接对象",
      type: "助词",
    },
    {
      text: "ノウハウ",
      kana: "のうはう",
      start: 13,
      end: 16,
      meaning: "诀窍，方法",
      desc: "表示共享的知识或技能",
      type: "名词",
    },
    {
      text: "として",
      kana: "として",
      start: 16,
      end: 19,
      meaning: "作为，作为…的",
      desc: "表示身份或角色的助词",
      type: "助词",
    },
    {
      text: "共有",
      kana: "きょうゆう",
      start: 19,
      end: 21,
      meaning: "共享，分享",
      desc: "表示将自己的东西与他人共同使用",
      type: "名词",
    },
    {
      text: "して",
      kana: "して",
      start: 21,
      end: 23,
      meaning: "进行，做，作为",
      desc: "表示动作的进行",
      type: "助动词",
    },
    {
      text: "おく",
      kana: "おく",
      start: 23,
      end: 25,
      meaning: "放置，事先准备",
      desc: "表示某种状态的保持或准备",
      type: "动词",
    },
  ],
  explain: "因为已经能够实现以下内容，所以将这本书作为诀窍分享出来。",
};
const data2 = {
  texts: [
    {
      text: "以下",
      kana: "いか",
      start: 0,
      end: 2,
      meaning: "以下，以下的内容",
      desc: "表示接下来要提到的内容或结果",
      type: "名词",
    },
    { text: "で", kana: "で", start: 2, end: 3, meaning: "通过，用", desc: "表示手段或方法的助词", type: "助词" },
    {
      text: "実現",
      kana: "じつげん",
      start: 3,
      end: 5,
      meaning: "实现，达成",
      desc: "表示某个目标的达到或完成",
      type: "名词",
    },
    {
      text: "できた",
      kana: "できた",
      start: 5,
      end: 8,
      meaning: "能够做到，完成",
      desc: "表示过去时态，表示已经完成某个动作",
      type: "动词",
    },
    {
      text: "ので",
      kana: "ので",
      start: 8,
      end: 10,
      meaning: "因为，由于",
      desc: "表示原因或理由的连接词",
      type: "助词",
    },
    {
      text: "本書",
      kana: "ほんしょ",
      start: 10,
      end: 12,
      meaning: "本书，这本书",
      desc: "指代前文提到的书籍",
      type: "名词",
    },
    {
      text: "を",
      kana: "を",
      start: 12,
      end: 13,
      meaning: "表示宾语的助词",
      desc: "用于表示动作的直接对象",
      type: "助词",
    },
    {
      text: "ノウハウ",
      kana: "のうはう",
      start: 13,
      end: 16,
      meaning: "诀窍，方法",
      desc: "表示共享的知识或技能",
      type: "名词",
    },
    {
      text: "として",
      kana: "として",
      start: 16,
      end: 19,
      meaning: "作为，作为…的",
      desc: "表示身份或角色的助词",
      type: "助词",
    },
    {
      text: "共有",
      kana: "きょうゆう",
      start: 19,
      end: 21,
      meaning: "共享，分享",
      desc: "表示将自己的东西与他人共同使用",
      type: "名词",
    },
    {
      text: "して",
      kana: "して",
      start: 21,
      end: 23,
      meaning: "进行，做，作为",
      desc: "表示动作的进行",
      type: "助动词",
    },
    {
      text: "おく",
      kana: "おく",
      start: 23,
      end: 25,
      meaning: "放置，事先准备",
      desc: "表示某种状态的保持或准备",
      type: "动词",
    },
  ],
  explain: "因为已经能够实现以下内容，所以将这本书作为诀窍分享出来。",
};

function ParagraphAnalysis(props: ViewComponentProps) {
  const $input = new InputCore({
    defaultValue: "",
  });
  const $submit = new ButtonCore({
    onClick() {
      const value = $input.value;
      if (!value) {
        props.app.tip({
          text: ["请先输入要分析的内容"],
        });
        return;
      }
      const data = data1;
      _analysis = {
        segments: data.texts,
        explain: data.explain,
      };
      bus.emit(Events.Change, { ...state });
    },
  });

  let _analysis: null | {
    segments: {
      kana: string;
      text: string;
      meaning: string;
      type: string;
    }[];
    explain: string;
  } = null;

  const state = {
    get analysis() {
      return _analysis;
    },
  };

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    state,
    ui: {
      $input,
      $submit,
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export function ParagraphAnalysisPage(props: ViewComponentProps) {
  const $page = ParagraphAnalysis(props);

  const [state, setState] = createSignal($page.state);
  $page.onChange((v) => setState(v));

  return (
    <div class="relative h-full pt-8">
      <div class="w-[960px] mx-auto">
        <div class="flex space-x-2">
          <Textarea store={$page.ui.$input} />
          <Button store={$page.ui.$submit}>解析</Button>
        </div>
      </div>
      <Show when={state().analysis}>
        <div class="flex justify-center mt-8">
          <div>
            <div class="space-x-1 text-3xl">
              <For each={state().analysis?.segments}>
                {(segment) => {
                  return (
                    <div
                      class="relative inline-block p-2 pt-8 text-center"
                      classList={{
                        "underline decoration-solid decoration-2 decoration-green-400": segment.type === "名词",
                        "underline decoration-wavy decoration-2 decoration-blue-400": segment.type === "动词",
                        "text-red-800": segment.type === "副词",
                        "underline decoration-dashed decoration-2": segment.type === "助词",
                        "underline decoration-dotted decoration-2": segment.type === "助动词",
                      }}
                      style={{
                        "min-width": `${segment.kana.length * 20}px`,
                      }}
                    >
                      <Show when={segment.kana !== segment.text}>
                        <span class="absolute top-0 left-1/2 -translate-x-1/2 text-gray-500 text-[0.6em] whitespace-nowrap">
                          {segment.kana}
                        </span>
                      </Show>
                      {segment.text}
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="mt-4">
              <div class="p-2 text-gray-800">{state().analysis?.explain}</div>
            </div>
          </div>
        </div>
      </Show>
      <div></div>
    </div>
  );
}
