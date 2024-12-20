/**
 * @file 首页
 */
import { createSignal, For, onMount, Show } from "solid-js";
import { Copy, Info, Loader, ReceiptEuroIcon, Search, SwitchCamera } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { ButtonCore } from "@/domains/ui";
import {
  Gojūon_in_sort1,
  jp_chars_in_sort1_grouped_by_pian_count,
  jp_chars_in_sort1_grouped_by_pin_count,
  VoicedSounds_in_sort1,
  Yōon_in_sort1,
  JPChar,
} from "@/biz/japanese_input/constants";
import { AudioCore } from "@/domains/audio";
import { Audio } from "@/components/ui/audio";

enum SheetTypes {
  /** 五十音 */
  Gojūon,
  /** 浊音 */
  VoicedSounds,
  /** 拗音 */
  Yōon,
  /** 五十音按笔画数分组 */
  GojūonGroupByCount,
}

export const HomeIndexPage: ViewComponent = (props) => {
  const { app } = props;

  const $audio = AudioCore();

  const [s, setS] = createSignal(true);
  const [curTable, setCurTable] = createSignal(SheetTypes.Gojūon);

  function play(char: JPChar) {
    if (char.placeholder) {
      return;
    }
    $audio.setURL(`/voices/${char.id}.mp3`);
    $audio.play();
  }

  return (
    <>
      <div class="relative h-full pt-4">
        <div class="absolute right-2 top-2">
          <div class="absolute right-2 top-0">
            <div class="flex">
              {/* <div class="p-4 bg-gray-100">
                <Search
                  class="w-6 h-6"
                  onClick={() => {
                    $btn.click();
                  }}
                />
              </div>
              <div class="p-4 bg-gray-100">
                <SwitchCamera
                  class="w-6 h-6"
                  onClick={() => {
                    $btn.click();
                  }}
                />
              </div>
              <div class="p-4 bg-gray-100">
                <Info
                  class="w-6 h-6"
                  onClick={() => {
                    $btn.click();
                  }}
                />
              </div> */}
            </div>
          </div>
        </div>
        <Audio store={$audio} />
        <div class="relative flex justify-center space-x-4">
          <div>
            <div class="flex space-x-2">
              <div
                classList={{
                  "px-4 py-2 rounded-md bg-gray-100 cursor-pointer": true,
                  "bg-gray-300": curTable() === SheetTypes.Gojūon,
                }}
                onClick={() => {
                  setCurTable(SheetTypes.Gojūon);
                }}
              >
                <div>五十音</div>
              </div>
              <div
                classList={{
                  "px-4 py-2 rounded-md bg-gray-100 cursor-pointer": true,
                  "bg-gray-300": curTable() === SheetTypes.VoicedSounds,
                }}
                onClick={() => {
                  setCurTable(SheetTypes.VoicedSounds);
                }}
              >
                <div>浊音</div>
              </div>
              <div
                classList={{
                  "px-4 py-2 rounded-md bg-gray-100 cursor-pointer": true,
                  "bg-gray-300": curTable() === SheetTypes.Yōon,
                }}
                onClick={() => {
                  setCurTable(SheetTypes.Yōon);
                }}
              >
                <div>拗音</div>
              </div>
            </div>
            <div class="mt-2">
              <div
                class="panel1"
                style={{ display: curTable() === SheetTypes.Gojūon ? "block" : "none", width: `${60 * 5}px` }}
              >
                <For each={Gojūon_in_sort1}>
                  {(char) => {
                    return (
                      <div
                        class="inline-flex items-center justify-center w-[60px] h-[68px] border "
                        onClick={() => {
                          play(char);
                        }}
                      >
                        <div
                          class="text-center"
                          classList={{
                            "opacity-20": char.placeholder,
                          }}
                        >
                          <div class="text-3xl">{s() ? char.hiragana : char.katakana}</div>
                          <div>{char.rōmaji}</div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
              <div
                class="panel4"
                style={{ display: curTable() === SheetTypes.Yōon ? "block" : "none", width: `${100 * 3}px` }}
              >
                <For each={Yōon_in_sort1}>
                  {(char) => {
                    return (
                      <div
                        class="inline-flex items-center justify-center w-[100px] h-[68px] border "
                        onClick={() => {
                          play(char);
                        }}
                      >
                        <div
                          class="text-center"
                          classList={{
                            "opacity-20": char.placeholder,
                          }}
                        >
                          <div class="text-3xl">{s() ? char.hiragana : char.katakana}</div>
                          <div>{char.rōmaji}</div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
              <div
                class="panel3"
                style={{ display: curTable() === SheetTypes.VoicedSounds ? "block" : "none", width: `${60 * 5}px` }}
              >
                <For each={VoicedSounds_in_sort1}>
                  {(char) => {
                    return (
                      <div
                        class="inline-flex items-center justify-center w-[60px] h-[68px] border "
                        onClick={() => {
                          play(char);
                        }}
                      >
                        <div
                          class="text-center"
                          classList={{
                            "opacity-20": char.placeholder,
                          }}
                        >
                          <div class="text-3xl">{s() ? char.hiragana : char.katakana}</div>
                          <div>{char.rōmaji}</div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
              <div
                class="panel2"
                style={{
                  display: curTable() === SheetTypes.GojūonGroupByCount ? "block" : "none",
                  width: `${60 * 8}px`,
                }}
              >
                <For each={s() ? jp_chars_in_sort1_grouped_by_pin_count : jp_chars_in_sort1_grouped_by_pian_count}>
                  {(group) => {
                    return (
                      <div class="">
                        <For each={group.chars}>
                          {(char) => {
                            return (
                              <div
                                class="relative inline-flex items-center justify-center w-[60px] h-[68px] border "
                                onClick={() => {
                                  play(char);
                                }}
                              >
                                <div class="absolute right-1 top-1 opacity-20">
                                  {s() ? char.hiragana_count : char.katakana_count}
                                </div>
                                <div
                                  class="text-center"
                                  classList={{
                                    "opacity-20": char.placeholder,
                                  }}
                                >
                                  <div class="text-3xl">{s() ? char.hiragana : char.katakana}</div>
                                  <div>{char.rōmaji}</div>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
