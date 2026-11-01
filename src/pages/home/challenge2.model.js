import { JapaneseInputCore } from "@/biz/japanese_input";
import { shuffleArray } from "@/utils";
import { words } from "./words.js";

/** @param {ViewComponentProps} props */
export function WordChallengePageModel(props) {
  const questions = shuffleArray(words);
  const index_ = ref(0);
  const correct_ = ref(null);
  const completed_ = ref(false);
  const input$ = JapaneseInputCore({ app: props.app });
  let timer;
  const methods = {
    submit() {
      const value = input$.value;
      if (!value || completed_.value || correct_.value === true) return;
      const question = questions[index_.value];
      correct_.as(value === question.word || value === question.hiragana);
      if (!correct_.value) return;
      timer = setTimeout(() => {
        input$.clear();
        input$.focus();
        methods.next();
      }, 2000);
    },
    next() {
      if (completed_.value) return;
      if (index_.value + 1 >= questions.length) completed_.as(true);
      else index_.increment();
      correct_.as(null);
    },
    tip() { if (!completed_.value) props.app.tip({ text: [questions[index_.value].romaji] }); },
    destroy() { clearTimeout(timer); off(); },
  };
  const off = input$.onEnter(methods.submit);
  return {
    state: {
      meaning: computed(index_, (v) => questions[v].meaning),
      index: computed(index_, (v) => v + 1), total: questions.length,
      progress: combine({ index: index_, completed: completed_ }, (s) => s.completed ? 100 : s.index / questions.length * 100),
      correct: correct_, completed: completed_,
    },
    ui: {
      input$,
      submit$: new Timeless.vm.ButtonCore({ onClick: methods.submit }),
      tip$: new Timeless.vm.ButtonCore({ onClick: methods.tip }),
    },
    methods,
  };
}
