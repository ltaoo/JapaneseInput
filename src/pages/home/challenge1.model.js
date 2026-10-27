import { CanvasCore } from "@/biz/canvas";
import { RecognizeCore } from "@/biz/recognize";
import { Gojūon_in_sort1 } from "@/biz/japanese_input/constants";
import { KanaCore } from "@/biz/kana";
import { AudioCore } from "@/domains/audio";
import { shuffleArray } from "@/utils";

/** @param {ViewComponentProps} props */
export function HiraganaChallengePageModel(props) {
  const questions = shuffleArray(Gojūon_in_sort1.filter((char) => !char.placeholder));
  const index_ = ref(0);
  const correct_ = ref(null);
  const completed_ = ref(false);
  const audio$ = AudioCore();
  let timer;
  const recognize$ = RecognizeCore({
    app: props.app,
    $canvas: CanvasCore({}),
    onSubmit({ text }) {
      if (completed_.value || correct_.value === true) return;
      correct_.as(text === questions[index_.value].hiragana);
      if (!correct_.value) return;
      timer = setTimeout(() => {
        recognize$.clear();
        methods.next();
      }, 2000);
    },
  });
  const methods = {
    play() {
      if (completed_.value) return;
      const voice = KanaCore(questions[index_.value]).voice();
      if (!voice) { props.app.tip({ text: ["没有找到音频文件"] }); return; }
      audio$.setURL(voice);
      audio$.play();
    },
    next() {
      if (completed_.value) return;
      if (index_.value + 1 >= questions.length) completed_.as(true);
      else index_.increment();
      correct_.as(null);
      methods.play();
    },
    tip() { if (!completed_.value) props.app.tip({ text: [questions[index_.value].hiragana] }); },
    destroy() { clearTimeout(timer); off(); recognize$.destroy(); },
  };
  const recognize_button$ = new Timeless.vm.ButtonCore({ onClick: () => recognize$.recognize() });
  const off = recognize$.onChange(() => recognize_button$.setLoading(recognize$.state.pending));
  return {
    state: {
      index: computed(index_, (v) => v + 1), total: questions.length,
      progress: combine({ index: index_, completed: completed_ }, (s) => s.completed ? 100 : s.index / questions.length * 100),
      correct: correct_, completed: completed_,
    },
    ui: {
      recognize$, audio$,
      play$: new Timeless.vm.ButtonCore({ onClick: methods.play }),
      recognize_button$,
      clear$: new Timeless.vm.ButtonCore({ onClick: () => recognize$.clear() }),
      tip$: new Timeless.vm.ButtonCore({ onClick: methods.tip }),
    },
    methods,
  };
}
