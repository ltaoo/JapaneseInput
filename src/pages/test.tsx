import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { ComicBook, PageFlipStep } from "@/biz/comic_book";
import { ComicBookPage } from "@/biz/comic_book/page";
import { ElementJQueryLikeCore, TreeNode } from "@/biz/comic_book/element";
import { connect, connect2, connect3, connect4, connect5, bind } from "@/biz/comic_book/connect.web";
import { PageFlipEffect } from "@/biz/comic_book/flip";

const pictures = ["/240.jpg", "/241.jpg", "/242.jpg", "/243.jpg", "/244.jpg", "/245.jpg", "/246.jpg", "/247.jpg"];

export function TestPage() {
  let $fparent: HTMLDivElement | undefined;
  let $elm: HTMLDivElement | undefined;

  const $comic = ComicBook<{ text: string }>({
    page: 5,
    width: 800,
    height: 500,
    page_count: 1000,
    // duration: 1000 * 60 * 10,
    duration: 3000,
    //     duration: 500,
  });

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
    console.log("after for loop addPage");
    $comic.methods.refresh();
    //     $comic.methods.update();
  });

  onMount(() => {
    if ($fparent && $elm) {
      connect3($comic, $elm, $fparent);

      //       const page = 2;
      //       const view = ["2", "3"];

      //       const range = $comic.methods.range(page);
      //       console.log("[PAGE]handler Turning", page, view, range);
      //       //     console.log(page, view, range);
      //       for (let i = range[0]; i <= range[1]; i++) {
      //         if (!$comic.methods.existing(i)) {
      //           $comic.methods.addPage(ComicBookPage({ page: i, payload: { text: `page ${i}.jpg` } }), i);
      //         }
      //       }
      //       console.log("after for loop addPage");
      //       $comic.methods.refresh();
      $comic.methods.initialize();
    }
  });

  return (
    <div>
      <div>书籍</div>
      <div>{state().pages.length}</div>
      <div
        ref={$elm}
        class="relative mx-auto w-[800px] h-[500px] shadow-lg"
        style={{
          transform: "translate3d(0px, 0px, 0px)",
        }}
      >
        <For each={state().pages}>
          {(page) => {
            return <ComicPage book={$comic} store={page} />;
          }}
        </For>
        <div ref={$fparent} class="f_parent">
          <For each={state().flips}>
            {(flip) => {
              return <Flip store={flip} />;
            }}
          </For>
        </div>
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
        <div>{state().page}</div>
        <div>{state().step}</div>
      </div>
    </div>
  );
}

function ComicPage(props: { book: ComicBook<{ text: string }>; store: ComicBookPage<{ text: string }> }) {
  const [state, setState] = createSignal(props.store.state);
  const [book, setBook] = createSignal(props.book.state);

  let $wrap: HTMLDivElement | undefined;
  let $page: HTMLDivElement | undefined;

  props.store.onStateChange((state) => setState(state));
  props.book.onStateChange((state) => setBook(state));

  //   return (
  //     <ElementJQueryLike store={props.store.$elm}>
  //       <div class="text-center text-3xl" style={{ "line-height": "500px" }}>
  //         {state().payload.text}
  //       </div>
  //     </ElementJQueryLike>
  //   );
  onMount(() => {
    if ($wrap && $page) {
      connect(props.store, { $page, $wrap });
      //       props.store.$flip?.methods.initialize();
    }
  });

  const inner = (
    <div
      ref={$page}
      id={`page-${state().page}`}
      data-side={state().side}
      classList={{
        "page turn-page relative overflow-hidden": true,
        "bg-white border": true,
      }}
    >
      <div class="absolute h-[20px] bg-white text-black">{state().payload.text}</div>
      <img class="w-full h-full object-cover" src={pictures[state().page]} />
      {/* <div class="text-center text-3xl" style={{ "line-height": "500px" }}>
        {state().payload.text}
      </div> */}
    </div>
  );

  return (
    <div
      ref={$wrap}
      class="turn-page-wrapper"
      data-page={state().page}
      onTouchStart={(event) => {
        if (props.store.$flip) {
          props.store.$flip.methods._eventStart(event as any);
        }
      }}
      onTouchMove={(event) => {
        console.log("[ComicPage]_onTouchMove");
        if (props.store.$flip) {
          props.store.$flip.methods._eventMove(event as any);
        }
      }}
      onTouchEnd={(event) => {
        if (props.store.$flip) {
          props.store.$flip.methods._eventEnd();
        }
      }}
    >
      <Show when={state().displayed} fallback={inner}>
        <div
          class="__a wrapper"
          onAnimationEnd={(event) => {
            if (props.store.$flip) {
              connect4(props.store.$flip, event.target as HTMLElement);
            }
          }}
        >
          <Show
            when={book().step === PageFlipStep.Turning && book().page && state().page === book().page}
            fallback={inner}
          >
            <div></div>
          </Show>
        </div>
        <div
          class="__a b_shadow"
          onAnimationEnd={(event) => {
            if (props.store.$flip) {
              connect5(props.store.$flip, event.target as HTMLElement);
            }
          }}
        ></div>
      </Show>
    </div>
  );
}

function Flip(props: { store: PageFlipEffect }) {
  let $wrap: HTMLDivElement | undefined;
  let $tmp: HTMLDivElement | undefined;
  let $page: HTMLDivElement | undefined;
  let $ashadow: HTMLDivElement | undefined;
  let $bshadow: HTMLDivElement | undefined;

  const [state, setState] = createSignal(props.store.$next.state);

  onMount(() => {
    console.log("[FLIP]onMount", props.store.$fwrapper, $wrap);
    if ($wrap && $page && $ashadow && $tmp) {
      //       props.store.methods.initialize();
      //       props.store.methods.initialize();
      connect2(props.store, {
        $wrap,
        $page,
        $tmp,
        $ashadow,
      });
    }
  });

  return (
    <div ref={$wrap} class="f_wrapper">
      <div ref={$tmp} class="f_tmp">
        <div ref={$page} class="f_page">
          <div
            id={`page-${state().page}`}
            data-side={state().side}
            classList={{
              "__a page turn-page absolute inset-0 overflow-hidden": true,
              "bg-white border": true,
            }}
            style={{
              width: "400px",
              height: "500px",
              position: "absolute",
              inset: "0px auto auto 0px",
              "transform-origin": "0% 0%",
              transform:
                props.store.side === "backward"
                  ? `rotate(270deg) translate3d(-400px, 0px, 0px)`
                  : `rotate(90deg) translate3d(0px, -500px, 0px)`,
            }}
            // onAnimationEnd={(event) => {
            //   const elm = ElementJQueryLikeCore({ name: "folding", parent: null, tag: "div", class: "page" });
            //   const $page = props.store.$elm;
            //   bind(event.currentTarget, elm);
            //   props.store.methods.setFolding(elm);
            // }}
          >
            <div class="absolute h-[20px] bg-white text-black">{state().payload.text}</div>
            <img class="w-full h-full object-cover" src={pictures[state().page]} />
          </div>
          <div ref={$ashadow} class="a_shadow"></div>
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
