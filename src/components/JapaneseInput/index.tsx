/**
 * @file 日語輸入
 */
import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-solid";

import { Textarea } from "@/components/ui";
import { JapaneseInputCore } from "@/biz/japanese_input";

export function JapaneseInput(
  props: { store: ReturnType<typeof JapaneseInputCore> } & JSX.HTMLAttributes<HTMLInputElement>
) {
  const { store: $store } = props;

  let _pressing: Record<string, boolean> = {};
  const [state, setState] = createSignal($store.state);
  $store.onChange((v) => setState(v));
  onMount(() => {
    $store.init();
  });

  return (
    <>
      <div class="relative">
        <Textarea
          store={$store.ui.$input}
          onKeyDown={(event) => {
            console.log(event.code, event.key, _pressing);
            _pressing[event.key] = true;
            if (event.key === "Process") {
              return;
            }
            if (event.key === "Control" || event.key === "Meta") {
              return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              return;
            }
            if (_pressing["Control"] || _pressing["Meta"]) {
              // 允许复制粘贴等操作
              return;
            }
            if (_pressing["Shift"]) {
              // 允许输入大写字母
              return;
            }
            // if (event.code === "Enter" && !$store.state.isInputting && !$store.state.isSelecting) {
            //   event.preventDefault();
            //   $store.handleEnter();
            //   return;
            // }
            if (
              (event.code === "ArrowUp" || event.code === "ArrowDown") &&
              !$store.state.isInputting &&
              !$store.state.isSelecting
            ) {
              return;
            }
            if (event.code === "Space" && !$store.state.isInputting && !$store.state.isSelecting) {
              return;
            }
            if (event.code === "Backspace" && !$store.state.isInputting && !$store.state.isSelecting) {
              return;
            }
            event.preventDefault();
            $store.handleKeyup({
              key: event.key,
              code: event.code,
              preventDefault() {
                event.preventDefault();
              },
            });
          }}
          onKeyUp={(event) => {
            delete _pressing[event.key];
          }}
          onClick={() => {
            $store.reset();
          }}
        />
      </div>
      <Show when={state().isInputting}>
        <div
          class="z-90 fixed"
          style={{ "z-index": 9998, left: `${state().popup.x}px`, top: `${state().popup.y}px` }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          <div
            class="absolute min-w-[68px] min-h-[108px] p-2 rounded-md border bg-white box-shadow whitespace-nowrap"
            style={(() => {
              const ss: Partial<{ right: string; bottom: string }> = {};
              if (state().popup.h === "left") {
                ss.right = "0px";
              }
              if (state().popup.v === "up") {
                ss.bottom = "0px";
              }
              return ss;
            })()}
          >
            <div class="">
              {state().value}
              <span
                class="inline-block relative top-[-2px] w-[2px] h-[16px] ml-[4px] align-middle bg-blue-500"
                style={{ "vertical-align": "middle" }}
              ></span>
            </div>
          </div>
        </div>
      </Show>
      <Show when={state().isSelecting}>
        <div
          class="fixed"
          style={{ "z-index": 9999, left: `${state().popup.x}px`, top: `${state().popup.y}px` }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          <div
            class="absolute min-w-[88px] min-h-[108px] p-2 rounded-md border bg-white box-shadow whitespace-nowrap"
            style={(() => {
              const ss: Partial<{ right: string; bottom: string }> = {};
              if (state().popup.h === "left") {
                ss.right = "0px";
              }
              if (state().popup.v === "up") {
                ss.bottom = "0px";
              }
              return ss;
            })()}
          >
            <div class="p-2 underline decoration-2 underline-offset-4">{state().selected}</div>
            <div class="h-[300px] text-sm">
              <For each={state().kanjiResp.list}>
                {(opt, i) => {
                  return (
                    <div
                      class="p-2"
                      classList={{
                        "bg-gray-100": i() === state().selectedIndex,
                      }}
                      onClick={() => {

                      }}
                    >
                      {i() + 1}. {opt.text}
                    </div>
                  );
                }}
              </For>
            </div>
            <Show when={state().kanjiResp.hasMore}>
              <div class="flex text-gray-500">
                <div
                  class="p-1 border cursor-pointer"
                  classList={{
                    "text-gray-100": !state().kanjiResp.canPrev,
                  }}
                  onClick={() => {
                    $store.prevPageKanji();
                  }}
                >
                  <ChevronUp class="w-4 h-4" />
                </div>
                <div
                  class="p-1 border cursor-pointer"
                  classList={{
                    "text-gray-100": !state().kanjiResp.canNext,
                  }}
                  onClick={() => {
                    $store.nextPageKanji();
                  }}
                >
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </>
  );
}

export type JaInputCore = ReturnType<typeof JapaneseInputCore>;
