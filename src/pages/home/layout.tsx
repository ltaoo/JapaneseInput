/**
 * @file 后台/首页布局
 */
import { For, JSX, createSignal, onMount } from "solid-js";

import { ViewComponent } from "@/store/types";
import { PageKeys } from "@/store/routes";
import { KeepAliveRouteView } from "@/components/ui";
import { cn } from "@/utils/index";
import { __VERSION__ } from "@/constants/index";

export const HomeLayout: ViewComponent = (props) => {
  const { app, history, client, storage, pages, view } = props;

  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((v) => {
    setSubViews(v);
  });

  return (
    <>
      <div class="flex flex-col h-full bg-white">
        <div class="h-[88px] py-4 bg-gray-100">
          <div class="flex w-[960px] mx-auto  space-x-4">
            <div
              class="menu p-4 rounded-md bg-gray-300 cursor-pointer"
              onClick={() => {
                history.push("root.home_layout.index");
              }}
            >
              首页
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.challenge1");
              }}
            >
              平假名挑战
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.challenge2");
              }}
            >
              单词挑战
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.analysis");
              }}
            >
              句子分析
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.analysis");
              }}
            >
              日剧字幕
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.analysis");
              }}
            >
              摘抄本
            </div>
            <div
              class="menu p-4"
              onClick={() => {
                history.push("root.home_layout.analysis");
              }}
            >
              生词本
            </div>
          </div>
        </div>
        <div class="flex-1">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const routeName = subView.name;
                const PageContent = pages[routeName as Exclude<PageKeys, "root">];
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <PageContent
                      app={app}
                      client={client}
                      storage={storage}
                      pages={pages}
                      history={history}
                      view={subView}
                    />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};
