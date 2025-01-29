import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { ComicBook } from "@/biz/comic_book";
import { ComicBookPage } from "@/biz/comic_book/page";
import { ElementJQueryLikeCore, TreeNode } from "@/biz/comic_book/element";
import { connect } from "@/biz/comic_book/connect.web";

export function TestPage() {
  const $comic = ComicBook<{ text: string }>({ page: 2, width: 800, height: 500, page_count: 1000 });

  const [state, setState] = createSignal($comic.state);
  $comic.onStateChange((state) => setState(state));
  $comic.onTurning(({ page, view }) => {
    const range = $comic.methods.range(page);
    console.log("[PAGE]handler Turning", page, view, range);
    //     console.log(page, view, range);
    for (let i = range[0]; i <= range[1]; i++) {
      if (!$comic.methods.existing(i)) {
        $comic.methods.addPage(ComicBookPage({ page: i, payload: { text: `page ${i}.jpg` } }), i);
      }
    }
    $comic.methods.refresh();
    $comic.methods.update();
  });

  onMount(() => {
    console.log("[PAGE]before initialize");
    $comic.methods.initialize();
  });

  return (
    <div>
      <div>书籍</div>
      <div>{state().pages.length}</div>
      <div class="relative mx-auto w-[800px] h-[500px] shadow-lg">
        <For each={state().pages}>
          {(page) => {
            return <ComicPage store={page} />;
          }}
        </For>
      </div>
      <div>
        <div class="flex justify-center gap-4 mt-4">
          <button
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md"
            onClick={() => $comic.methods.prev()}
          >
            上一页
          </button>
          <button
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md"
            onClick={() => $comic.methods.next()}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}

function ComicPage(props: { store: ComicBookPage<{ text: string }> }) {
  const [state, setState] = createSignal(props.store.state);

  let $wrap: HTMLDivElement | undefined;
  let $page: HTMLDivElement | undefined;

  props.store.onStateChange((state) => setState(state));

  //   return (
  //     <ElementJQueryLike store={props.store.$elm}>
  //       <div class="text-center text-3xl" style={{ "line-height": "500px" }}>
  //         {state().payload.text}
  //       </div>
  //     </ElementJQueryLike>
  //   );
  onMount(() => {
    if ($wrap && $page) {
      connect(props.store, $page, $wrap);
    }
  });

  return (
    <div ref={$wrap} class="wrap">
      <div
        ref={$page}
        classList={{
          page: true,
          "bg-white border": true,
        }}
      >
        <div class="text-center text-3xl" style={{ "line-height": "500px" }}>
          {state().payload.text}
        </div>
      </div>
    </div>
  );
}

function ElementJQueryLike(props: { store: ElementJQueryLikeCore } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store, ...rest } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((state) => setState(state));

  const renderElement = (node: TreeNode) => {
    const Tag = node.tag;
    return (
      <Dynamic component={Tag}>
        <Show when={node.children} fallback={props.children}>
          <For each={node.children}>{(child) => renderElement(child)}</For>
        </Show>
      </Dynamic>
    );
  };

  return renderElement(state());
}
