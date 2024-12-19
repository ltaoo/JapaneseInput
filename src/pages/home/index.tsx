/**
 * @file 首页
 */
import { createSignal, For, onMount, Show } from "solid-js";
import { Copy, Info, Loader, ReceiptEuroIcon, Search, SwitchCamera } from "lucide-solid";
import Tesseract, { createWorker, Worker } from "tesseract.js";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Button, Dialog, Input, Textarea } from "@/components/ui";
import { ButtonCore, DialogCore, InputCore } from "@/domains/ui";
import { base, Handler } from "@/domains/base";
import {
  jp_chars2,
  jp_chars_in_sort1,
  jp_chars_in_sort1_grouped_by_pian_count,
  jp_chars_in_sort1_grouped_by_pin_count,
  jp_chars_in_sort2,
  jp_chars_in_sort3,
  JPChar,
  NestedJPChar,
} from "@/components/JapaneseInput/constants";
import { AudioCore } from "@/domains/audio";
import { Audio } from "@/components/ui/audio";

export const HomeIndexPage: ViewComponent = (props) => {
  const { app } = props;

  const $audio = AudioCore();

  const [s, setS] = createSignal(true);
  const [cur, setCur] = createSignal(1);

  const $btn = new ButtonCore({
    onClick() {
      setS((prev) => !prev);
    },
  });
  function play(char: JPChar) {
    if (char.placeholder) {
      return;
    }
    $audio.setURL(`/voices/${char.id}.mp3`);
    $audio.play();
  }

  return (
    <>
      <div class="relative h-full pt-8">
        <div class="absolute right-2 top-2">
          <div class="absolute right-2 top-0">
            <div class="flex">
              <div class="p-4 bg-gray-100">
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
              </div>
            </div>
          </div>
        </div>
        <Audio store={$audio} />
        <div class="relative flex justify-center space-x-4">
          <div>
            <div class="flex space-x-2">
              <div
                class="px-4 py-2 rounded-md bg-gray-100 bg-gray-300 cursor-pointer"
                onClick={() => {
                  setCur(1);
                }}
              >
                <div>五十音</div>
              </div>
              <div
                class="px-4 py-2 rounded-md bg-gray-100 cursor-pointer"
                onClick={() => {
                  setCur(3);
                }}
              >
                <div>浊音</div>
              </div>
              <div
                class="px-4 py-2 rounded-md bg-gray-100 cursor-pointer"
                onClick={() => {
                  setCur(4);
                }}
              >
                <div>拗音</div>
              </div>
            </div>
            <div class="mt-2">
              <div class="panel1" style={{ display: cur() === 1 ? "block" : "none", width: `${60 * 5}px` }}>
                <For each={jp_chars_in_sort1}>
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
                          <div class="text-3xl">{s() ? char.pin : char.pian}</div>
                          <div>{char.luo}</div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
              <div class="panel2" style={{ display: cur() === 2 ? "block" : "none", width: `${60 * 8}px` }}>
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
                                  {s() ? char.pin_count : char.pian_count}
                                </div>
                                <div
                                  class="text-center"
                                  classList={{
                                    "opacity-20": char.placeholder,
                                  }}
                                >
                                  <div class="text-3xl">{s() ? char.pin : char.pian}</div>
                                  <div>{char.luo}</div>
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
              <div class="panel3" style={{ display: cur() === 3 ? "block" : "none", width: `${60 * 5}px` }}>
                <For each={jp_chars_in_sort2}>
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
                          <div class="text-3xl">{s() ? char.pin : char.pian}</div>
                          <div>{char.luo}</div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
              <div class="panel4" style={{ display: cur() === 4 ? "block" : "none", width: `${100 * 3}px` }}>
                <For each={jp_chars_in_sort3}>
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
                          <div class="text-3xl">{s() ? char.pin : char.pian}</div>
                          <div>{char.luo}</div>
                        </div>
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
