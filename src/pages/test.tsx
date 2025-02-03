import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { ComicBook, PageFlipStep } from "@/biz/comic_book";
import { ComicBookPage } from "@/biz/comic_book/page";
import { ElementJQueryLikeCore, TreeNode } from "@/biz/comic_book/element";
import { connect, connect2, connect3, connect4, connect5, bind } from "@/biz/comic_book/connect.web";
import { PageFlipEffect } from "@/biz/comic_book/flip";
import { ScrollView } from "@/components/ui";
import { ScrollViewCore } from "@/domains/ui";

const pictures = ["/240.jpg", "/241.jpg", "/242.jpg", "/243.jpg", "/244.jpg", "/245.jpg", "/246.jpg", "/247.jpg"];
// const pictures = [];

export function TestPage() {
  let $fparent: HTMLDivElement | undefined;
  let $elm: HTMLDivElement | undefined;

  const $view = new ScrollViewCore({});
  const $comic = ComicBook<{ text: string }>({
    page: 5,
    width: 800,
    height: 500,
    page_count: 1000,
    // duration: 1000 * 60 * 2,
    duration: 800,
    //     duration: 500,
  });
  let _mounted = false;

  const [state, setState] = createSignal($comic.state);
  $comic.onStateChange((state) => setState(state));
  $comic.onTurning(({ page, view }) => {
    if (_mounted) {
      return;
    }
    _mounted = true;
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
      $comic.methods.initialize();
    }
    const $flip = $comic.$flips.find(($flip) => $flip.page === 5);
    // const animate = () => {
    //   if ($flip) {
    //     cornerX -= 10; // Increment X position
    //     const corner = {
    //       corner: "br",
    //       x: cornerX,
    //       y: 500,
    //     };
    //     $flip.methods._showFoldedPage(corner);

    //     if (cornerX > -400) {
    //       animationFrameId = requestAnimationFrame(animate);
    //     }
    //   }
    // };
    // animate();

    // document.addEventListener("wheel", (event) => {
    //   console.log("[TestPage]_onWheel", event, event.deltaX, event.clientX, event.pageX);
    //   if (event.deltaY < 0) {
    //     // Scroll up to trigger animation
    //     cornerX = -1000; // Reset position
    //     cancelAnimationFrame(animationFrameId); // Cancel any existing animation
    //     animate(); // Start new animation
    //   }
    // });
    // const corner = {
    //   corner: "br",
    //   x: 300,
    //   y: 500,
    // };
    // if ($flip) {
    //   $flip.methods._showFoldedPage(corner);
    // }
    document.addEventListener("keydown", (e) => {
      if (!e.target) {
        return;
      }
      if (e.keyCode == 37) {
        $comic.methods.prev();
      }
      if (e.keyCode == 39) {
        $comic.methods.next();
      }
    });

    // const af = new AlloyFinger(document.body, {
    //   // touchStart: (event) => {
    //   //   console.log("[TestPage]_onTouchStart", event);
    //   // },
    //   swipe(evt) {
    //     console.log("swipe" + evt.direction);
    //   },
    // });
    // document.addEventListener("touchstart", (event) => {
    //   console.log("[TestPage]_onTouchStart", event);
    // });
    // document.addEventListener("touchmove", (event) => {
    //   console.log("[TestPage]_onTouchMove", event);
    // });
    // document.addEventListener("touchend", (event) => {
    //   console.log("[TestPage]_onTouchEnd", event);
    // });
    let _initial = false;
    let _x = 0;
    document.addEventListener("wheel", (event) => {
      // event.preventDefault();
      if (!_initial) {
        _x = event.clientX;
        _initial = true;
      }
      const distance = event.clientX - _x;
      if ($flip) {
        const corner = {
          corner: "br",
          x: 400 - distance * 48,
          y: 500,
        };
        console.log("[TestPage]_onWheel", distance, corner.x);
        $flip.methods._showFoldedPage(corner);
      }
    });
  });

  return (
    <div class="pt-12 px-4 min-h-screen bg-w-bg-0">
      <div
        ref={$elm}
        class="relative"
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
              return <FlipPage store={flip} />;
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
  const [flip, setFlip] = createSignal(props.store.$flip?.state);
  const [book, setBook] = createSignal(props.book.state);

  let $wrap: HTMLDivElement | undefined;
  let $page: HTMLDivElement | undefined;

  props.store.onStateChange((state) => setState(state));
  props.book.onStateChange((state) => setBook(state));
  props.store.$flip?.onStateChange((state) => setFlip(state));

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
      id={`wrapper-${state().page}`}
      data-page={state().page}
      // onTouchStart={(event) => {
      //   if (props.store.$flip) {
      //     props.store.$flip.methods._eventStart(event as any);
      //   }
      // }}
      // onTouchMove={(event) => {
      //   console.log("[ComicPage]_onTouchMove");
      //   if (props.store.$flip) {
      //     props.store.$flip.methods._eventMove(event as any);
      //   }
      // }}
      // onTouchEnd={(event) => {
      //   if (props.store.$flip) {
      //     props.store.$flip.methods._eventEnd();
      //   }
      // }}
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

function FlipPage(props: { store: PageFlipEffect }) {
  let $wrap: HTMLDivElement | undefined;
  let $tmp: HTMLDivElement | undefined;
  let $page: HTMLDivElement | undefined;
  let $ashadow: HTMLDivElement | undefined;
  let $bshadow: HTMLDivElement | undefined;

  const [state, setState] = createSignal(props.store.$next?.state);

  onMount(() => {
    // console.log("[FLIP]onMount", props.store.$fwrapper, $wrap);
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
    <div ref={$wrap} class="f_wrapper" style={{ display: "none" }}>
      <div ref={$tmp} class="f_tmp">
        <div ref={$page} class="f_page">
          <Show when={state()}>
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
          </Show>
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
