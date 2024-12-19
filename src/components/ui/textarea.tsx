import { createSignal, onMount } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { InputCore } from "@/domains/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { cn } from "@/utils";

export interface TextareaProps extends HTMLTextAreaElement {}

const Textarea = (props: { store: InputCore<string> } & JSX.HTMLAttributes<HTMLTextAreaElement>) => {
  const { store, class: className, ...restProps } = props;

  let ref: HTMLTextAreaElement | undefined;
  let fake: HTMLDivElement | undefined;

  const [state, setState] = createSignal(store.state);

  onMount(() => {
    if (!ref) {
      return;
    }
    if (!fake) {
      return;
    }
    const $input = ref;
    connect(store, ref);
    store.getCursorIndex = () => {
      return [$input.selectionStart, $input.selectionEnd];
    };
    store.setCursorIndex = (v: number) => {
      $input.setSelectionRange(v, v);
    };
    store.getCursorPosition = () => {
      const position = $input.selectionStart;
      console.log("[BIZ]ui/input - store.getSelectionPosition", position);
      if (position === null) {
        return { x: 0, y: 0 };
      }
      const text1 = $input.value.substring(0, position);
      const textNode1 = document.createTextNode(text1);
      const $cursor = document.createElement("span");
      $cursor.style.cssText = "display: inline-block; width: 1px; height: 12px;";
      fake.innerHTML = "";
      fake.appendChild(textNode1);
      fake.appendChild($cursor);
      const rect = $cursor.getBoundingClientRect();
      console.log("[BIZ]ui/input - store.getSelectionPosition", rect);
      return {
        x: rect.x + $input.offsetLeft,
        y: rect.y + $cursor.clientHeight + $input.offsetTop,
      };
    };
    store.offsetLeft = $input.offsetLeft;
    store.offsetTop = $input.offsetTop;
  });

  store.onStateChange((nextState) => {
    console.log("[COMPONENT]ui/textarea - store.onChange", nextState);
    setState(nextState);
  });

  const value = () => state().value;
  const placeholder = () => state().placeholder;
  const disabled = () => state().disabled;

  return (
    <div
      class={cn(
        "relative h-20 w-full rounded-md border border-slate-300 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
        props.class
      )}
    >
      <div
        ref={fake}
        class="absolute inset-0 opacity-0 w-full h-full py-2 px-3 rounded-md bg-transparent placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
        style={{ "z-index": 0, "white-space": "pre-wrap" }}
      ></div>
      <textarea
        ref={ref}
        class="z-10 relative w-full h-full py-2 px-3 rounded-md bg-transparent placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
        style={{ "z-index": 1 }}
        value={value()}
        placeholder={placeholder()}
        disabled={disabled()}
        onFocus={() => {
          store.handleFocus();
        }}
        onBlur={() => {
          store.handleBlur();
        }}
        onInput={(event: Event & { currentTarget: HTMLTextAreaElement }) => {
          const { value } = event.currentTarget;
          store.setValue(value);
        }}
        {...restProps}
      />
    </div>
  );
};
Textarea.displayName = "Textarea";

export { Textarea };
