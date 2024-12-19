/**
 * @file 日語輸入
 */
import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-solid";

import { ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { InputCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { Textarea } from "@/components/ui";

import { jp_chars2, jp_chars_in_sort1, jp_chars_in_sort2, jp_chars_in_sort3, JPChar, NestedJPChar } from "./constants";
import { dict, JPWord, NestedJPWord } from "./dict";
import { fetch_kanji_dict, fetch_kanji_patch_dict, search_kanji } from "./services";

/** 用平假名换片假名 */
function exchange_katakana(text: string) {
  let result = "";
  for (let i = 0; i < text.length; i += 1) {
    (() => {
      const char = text[i];
      const matched = [...jp_chars_in_sort1, ...jp_chars_in_sort2, ...jp_chars_in_sort3].find(
        (jp_char) => jp_char.pin === char
      );
      if (matched && matched.pian) {
        result += matched.pian;
        return;
      }
      result += char;
    })();
  }
  return result;
}

export function JapaneseInputCore(props: { app: ViewComponentProps["app"] }) {
  const { app } = props;

  const $input = new InputCore({
    defaultValue: "",
    onBlur() {
      reset();
    },
  });

  let _inputting: string[] = [];
  let _inputting2: string[] = [];
  let _result: JPChar[] = [];
  let _pressing: Record<string, boolean> = {};
  let _result3: string[] = [];
  let _dict: Record<string, string[]> = {};

  let _value = "";
  let _cursor = 0;
  let _input_cursor = 0;
  let _isInputting = false;
  let _input_position: { x: number; y: number; h: "left" | "right"; v: "up" | "down" } = {
    x: 0,
    y: 0,
    h: "right",
    v: "down",
  };
  let _isSelecting = false;
  // let _selected = "";
  let _selectedIndex = 0;
  let _kanji_resp: { list: { text: string }[]; page_size: number; page: number } = { list: [], page_size: 8, page: 1 };

  const state = {
    get value() {
      return _value;
    },
    get isInputting() {
      return _isInputting;
    },
    get popup() {
      return _input_position;
    },
    get selected() {
      // return _selected;
      return this.kanjiResp.list[_selectedIndex]?.text ?? "";
    },
    get isSelecting() {
      return _isSelecting;
    },
    get selectedIndex() {
      return _selectedIndex;
    },
    get kanjiResp() {
      const { list, page, page_size } = _kanji_resp;
      return {
        list: list.slice((page - 1) * page_size, page * page_size),
        page,
        hasMore: list.length > page_size,
        canPrev: page > 1,
        canNext: page < Math.ceil(list.length / page_size),
      };
    },
    get inputting() {
      return _inputting;
    },
    get result() {
      return _result;
    },
    get result3() {
      return _result3;
    },
  };
  enum Events {
    StartInput,
    CompleteInput,
    VisibleChange,
    Enter,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.StartInput]: void;
    [Events.CompleteInput]: void;
    [Events.VisibleChange]: { visible: boolean };
    [Events.Enter]: void;
    [Events.Change]: typeof state;
  };
  const bus = base<TheTypesOfEvents>();

  //   app.onKeydown(({ code, preventDefault }) => {
  //     if (code === "Tab") {
  //       preventDefault();
  //     }
  //     if (!code.match(/^Key[a-zA-Z]{1}$/)) {
  //       _pressing[code] = true;
  //     }
  //   });
  function match_words(inputs: JPChar[]): string[] {
    const w1 = match_words_by_pin(inputs);
    const w2 = match_words_by_pian(inputs);
    return [...w1, ...w2];
  }
  function match_words_by_pin(inputs: JPChar[]): string[] {
    let i = 0;
    let tmp_obj: NestedJPWord | JPWord = dict;
    while (i < inputs.length) {
      const c = inputs[i];
      let m1 = (tmp_obj as NestedJPWord)[c.pin] as NestedJPWord | JPWord;
      if (!m1) {
        return [];
      }
      tmp_obj = m1;
      i += 1;
    }
    if (!tmp_obj.choices) {
      return [];
    }
    return tmp_obj.choices as string[];
  }
  function match_words_by_pian(inputs: JPChar[]): string[] {
    let i = 0;
    let tmp_obj: NestedJPWord | JPWord = dict;
    while (i < inputs.length) {
      const c = inputs[i];
      let m1 = (tmp_obj as NestedJPWord)[c.pian] as NestedJPWord | JPWord;
      if (!m1) {
        return [];
      }
      tmp_obj = m1;
      i += 1;
    }
    if (!tmp_obj.choices) {
      return [];
    }
    return tmp_obj.choices as string[];
  }
  function match_ming(inputs: string[]): null | JPChar {
    const chars_inputting = inputs;
    if (chars_inputting.length > 3) {
      //       app.tip({
      //         text: ["请输入一个音后按空格，不要一次性输入过多字符串"],
      //       });
      return null;
    }
    let i = 0;
    let tmp_obj: NestedJPChar | JPChar = jp_chars2;
    while (i < chars_inputting.length) {
      const c = chars_inputting[i];
      const m1 = (tmp_obj as NestedJPChar)[c] as NestedJPChar | JPChar;
      console.log("[BIZ]JaInput - after tmp_obj[c]", m1);
      if (!m1) {
        // app.tip({
        //   text: [`在位置${i}上的字符${c}不对`],
        // });
        return null;
      }
      if (m1.pin) {
        return m1 as JPChar;
      }
      tmp_obj = m1;
      i += 1;
    }
    if (!tmp_obj.luo) {
      return null;
    }
    return tmp_obj as JPChar;
  }

  const $requests = {
    search: new RequestCore(search_kanji),
    dict: new RequestCore(fetch_kanji_dict),
    dict_patch: new RequestCore(fetch_kanji_patch_dict),
  };

  function confirm() {
    const v = _isSelecting ? state.selected : _value;
    const [start, end] = $input.getCursorIndex();
    const count = $input.value.length;
    console.log("[BIZ]JapInput - after get cursor index", start, end);
    (() => {
      if (start !== end) {
        // 说明有选择文本，使用输入的内容 替换 选择的文本
        $input.setValue($input.value.slice(0, start) + v + $input.value.slice(end));
        return;
      }
      $input.setValue($input.value.slice(0, start) + v + $input.value.slice(start));
    })();
    if (count !== start) {
      $input.setCursorIndex(start + v.length);
    }
    bus.emit(Events.CompleteInput);
  }
  function reset() {
    _value = "";
    _cursor = 0;
    _input_cursor = 0;
    _isInputting = false;
    _input_position = { x: 0, y: 0, h: "right", v: "down" };

    _isSelecting = false;
    // _selected = "";
    _selectedIndex = 0;
    _kanji_resp = {
      list: [],
      page_size: 8,
      page: 1,
    };
    bus.emit(Events.Change, { ...state });
  }
  function nextPageKanji(index = 0) {
    if (_kanji_resp.page === Math.ceil(_kanji_resp.list.length / _kanji_resp.page_size)) {
      return;
    }
    _kanji_resp.page += 1;
    _selectedIndex = index;
    bus.emit(Events.Change, { ...state });
  }
  function prevPageKanji(index = 0) {
    if (_kanji_resp.page === 1) {
      return;
    }
    _kanji_resp.page -= 1;
    _selectedIndex = index;
    bus.emit(Events.Change, { ...state });
  }
  async function handleKeyup(values: { key: string; code: string; preventDefault: () => void }) {
    const { key, code } = values;

    //     preventDefault();

    console.log("[PAGE]home/index - app.onKeyup", code, _pressing, _isInputting);

    setTimeout(() => {
      // 快捷键按得太快，Ctrl 的 up 会先于 c 的 up。导致 c up 认为是单独击键
      delete _pressing[code];
    }, 100);

    if (code === "Escape") {
      reset();
      return;
    }
    if (_isSelecting) {
      if (code === "ArrowUp") {
        let n = _selectedIndex - 1;
        if (n < 0) {
          n = _kanji_resp.page_size - 1;
          prevPageKanji(n);
          return;
        }
        _selectedIndex = n;
        // _selected = _kanji_resp.list[_selectedIndex].text;
        bus.emit(Events.Change, { ...state });
        return;
      }
      if (code === "ArrowDown") {
        let n = _selectedIndex + 1;

        if (n > state.kanjiResp.list.length - 1) {
          n = 0;
          nextPageKanji(n);
          return;
        }
        _selectedIndex = n;
        // _selected = _kanji_resp.list[_selectedIndex].text;
        bus.emit(Events.Change, { ...state });
        return;
      }
    }
    if (code === "Tab") {
      if (_isInputting) {
        // const r = await $requests.search.run(_value);
        // if (r.error) {
        //   app.tip({
        //     text: [r.error.message],
        //   });
        //   return;
        // }
        const kanji_list = _dict[_value] || [];
        _isSelecting = true;
        const result = [
          { text: _value },
          { text: exchange_katakana(_value) },
          ...kanji_list.map((w) => {
            return {
              text: w,
            };
          }),
        ];
        _selectedIndex = 2;
        _kanji_resp = {
          list: result,
          page: 1,
          page_size: 8,
        };
        if (!result[_selectedIndex]) {
          _selectedIndex = 0;
        }
        // _selected = result[_selectedIndex].text;
        bus.emit(Events.Change, { ...state });
        return;
      }
      $input.setValue($input.value + " ");
      //       bus.emit(Events.Change, { ...state });
      return;
    }
    if (code === "Space") {
      if (_isInputting || _isSelecting) {
        confirm();
        reset();
        return;
      }
      $input.setValue($input.value + " ");
      //       bus.emit(Events.Change, { ...state });
      return;
    }
    if (code === "BracketLeft") {
      if (!_isSelecting) {
        return;
      }
      prevPageKanji();
      return;
    }
    if (code === "BracketRight") {
      if (!_isSelecting) {
        return;
      }
      nextPageKanji();
      return;
    }
    if (code === "Backspace") {
      if (_isSelecting) {
        _isSelecting = false;
        // _selected = "";
        _selectedIndex = 0;
        _kanji_resp = {
          list: [],
          page_size: 8,
          page: 1,
        };
        bus.emit(Events.Change, { ...state });
        return;
      }
      if (_isInputting) {
        _value = _value.slice(0, _value.length - 1);
        //       if (_inputting.length === 0) {
        //         if (_result.length === 0) {
        //           return;
        //         }
        //         _result = _result.slice(0, _result.length - 1);
        //         const choices = match_words(_result);
        //         _result3 = choices;
        //         bus.emit(Events.Change, { ...state });
        //         return;
        //       }
        //       _inputting = _inputting.slice(0, _inputting.length - 1);
        if (_value.length === 0) {
          _isInputting = false;
          bus.emit(Events.VisibleChange, { visible: _isInputting });
        }
        console.log("[BIZ]JAInput - Backspace - before check", _input_cursor, _cursor);
        (() => {
          if (_input_cursor > _cursor) {
            _input_cursor -= 1;
            return;
          }
          if (_input_cursor === _cursor) {
            _cursor -= 1;
            if (_cursor < 0) {
              _cursor = 0;
            }
            _input_cursor = _cursor;
          }
        })();
        // if (_input_cursor !== _cursor) {
        //   _input_cursor -= 1;
        // }
        // if (_input_cursor === _cursor) {
        //   _cursor -= 1;
        //   if (_cursor < 0) {
        //     _cursor = 0;
        //   }
        //   _input_cursor = _cursor;
        // }
        //       const r = match_ming(_value.split(""));
        //       if (r !== null) {
        //         _value = r.pin;
        //       }
        bus.emit(Events.Change, { ...state });
        return;
      }
      //       $input.setValue($input.value.slice(0, $input.value.length - 1));
      return;
    }
    if (code === "Enter") {
      // console.log("before check", _isInputting, _isSelecting);
      if (_isInputting || _isSelecting) {
        confirm();
        reset();
        return;
      }
      // if (_inputting) {
      //         _isSelecting = false;
      //         _selected = "";
      //         _selectedIndex = 0;
      //         _options = [];
      //         $input.setValue($input.value + _selected);
      // 	//
      //         _isInputting = false;
      //         _value = "";
      //         _cursor = 0;
      //         _input_cursor = 0;
      //         bus.emit(Events.CompleteInput);
      //         bus.emit(Events.Change, { ...state });
      //         return;
      // }
      bus.emit(Events.Enter);
      // confirm();
      // reset();
      return;
    }
    if (!_isInputting) {
      _isInputting = true;
      const { x, y } = $input.getCursorPosition();
      const popup = {
        x: x,
        y: y + 8,
        width: 68,
        height: 108,
      };
      const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
      const horizontalOverflow = popup.x + popup.width > windowWidth || popup.x < 0;
      const verticalOverflow = popup.y + popup.height > windowHeight || popup.y < 0;
      // console.log("horizontalOverflow", popup.x, popup.width, windowWidth);
      _input_position = {
        x: popup.x,
        y: popup.y,
        h: "right",
        v: "down",
      };
      if (horizontalOverflow) {
        _input_position.x = x - 12;
        _input_position.h = "left";
      }
      if (verticalOverflow) {
        _input_position.y = y - 18;
        _input_position.v = "up";
      }
      console.log("[BIZ]JAInput - before show input-panel", _input_position);
      bus.emit(Events.StartInput);
      bus.emit(Events.Change, { ...state });
    }
    //     if (code === "Tab") {
    //       _inputting = [];
    //       _result.push(tmp_obj as JPChar);
    //       const choices = match_words(_result);
    //       _result3 = choices;
    //       bus.emit(Events.Change, { ...state });
    //       return;
    //     }
    if (!code.match(/^Key[a-zA-Z]{1}$/)) {
      return;
    }
    if (Object.keys(_pressing).length !== 0) {
      return;
    }
    //     if (key.match(/[aiueo]/)) {
    //       if (_inputting.length === 0) {
    //         const r = match_ming([key]);
    //         if (r) {
    //           _result = _result.concat(r);
    //         }
    //         const choices = match_words(_result);
    //         if (choices.length) {
    //           _result3 = choices;
    //         }
    //         bus.emit(Events.Change, { ...state });
    //         return;
    //       }
    //     }
    _inputting.push(key);
    _value += key;
    _input_cursor += 1;
    console.log("[BIZ]JaInput - before match_ming", _value, _cursor, _value.slice(_cursor));
    const r = match_ming(_value.slice(_cursor).split(""));
    if (r) {
      _value = _value.slice(0, _cursor) + r.pin;
      _cursor += r.pin.length;
      _input_cursor = _cursor;
    }
    bus.emit(Events.Change, { ...state });
  }

  //   app.onKeydown(handleKeyup);
  function patch_dict(content: string) {
    const words = content.split(";");
    for (let i = 0; i < words.length; i += 1) {
      const [text, kanji] = words[i].split(":");
      _dict[text] = _dict[text] || [];
      _dict[text].push(...kanji.split(","));
    }
  }

  return {
    Symbol: "JaInput" as const,
    state,
    get value() {
      return $input.value;
    },
    ui: {
      $input,
    },
    async init() {
      (async () => {
        const r = await $requests.dict.run();
        if (r.error) {
          app.tip({
            text: [r.error.message],
          });
          return;
        }
        const map = r.data;
        patch_dict(map);
      })();
      (async () => {
        const r = await $requests.dict_patch.run();
        if (r.error) {
          return;
        }
        const map = r.data;
        patch_dict(map);
      })();
    },
    reset,
    nextPageKanji,
    prevPageKanji,
    handleKeyup,
    change(v: string) {
      _value = v;
      bus.emit(Events.Change, { ...state });
    },
    clear() {
      $input.clear();
      // bus.emit(Events.Change, { ...state });
    },
    focus() {
      $input.focus();
    },
    handleEnter() {
      bus.emit(Events.Enter);
    },
    onEnter(handler: Handler<TheTypesOfEvents[Events.Enter]>) {
      return bus.on(Events.Enter, handler);
    },
    onVisibleChange(handler: Handler<TheTypesOfEvents[Events.VisibleChange]>) {
      return bus.on(Events.VisibleChange, handler);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export function JapaneseInput(props: { store: ReturnType<typeof JapaneseInputCore> } & JSX.HTMLAttributes<HTMLInputElement>) {
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
            if (event.key === "Control") {
              return;
            }
            if (event.key === "Alt") {
              return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              return;
            }
            if (_pressing["Control"]) {
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
            //       event.preventDefault();
            //       const { value } = event.currentTarget;
            //       console.log(value);
          }}
          //   onInput={(event) => {
          //     event.preventDefault();
          //     event.stopImmediatePropagation();
          //     event.stopPropagation();
          //     const { value } = event.currentTarget;
          //     console.log(value);
          //   }}
          onClick={() => {
            $store.reset();
          }}
        />
      </div>
      <Show when={state().isInputting}>
        <div
          class="z-90 fixed"
          style={{ "z-index": 9998, left: `${state().popup.x}px`, top: `${state().popup.y}px` }}
          // onClick={(event) => {
          //   event.preventDefault();
          //   event.currentTarget.addEventListener("mousedown", (event) => {
          //     event.preventDefault();
          //   });
          // }}
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
          // onClick={(event) => {
          //   event.preventDefault();
          //   event.currentTarget.addEventListener("mousedown", (event) => {
          //     event.preventDefault();
          //   });
          // }}
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
