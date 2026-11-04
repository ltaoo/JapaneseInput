import { BookPageModel, pictures } from "./test.model.js";
import { Action } from "@/components/controls.js";

export default function BookPageView() {
  const vm$ = BookPageModel();
  return View({ attributes: { n: "book-test-page", "data-n": "book-test-page" }, class: "study-page utility-page", onUnmounted() { vm$.methods.destroy(); } }, [
    View({ attributes: { n: "book-title", "data-n": "book-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["翻页演示"]),
    View({ attributes: { n: "book-controls", "data-n": "book-controls" } }, [
      Action({ name: "book-prev", store: vm$.ui.prev$, class: "button-secondary" }, ["上一页"]),
      View({ attributes: { n: "book-position", "data-n": "book-position", role: "status" } }, [computed(vm$.state.page, (page) => `${page + 1}–${page + 2} / ${pictures.length}`)]),
      Action({ name: "book-next", store: vm$.ui.next$ }, ["下一页"]),
    ]),
    View({ attributes: { n: "book-spread", "data-n": "book-spread" } }, [
      ...[0, 1].map((offset) => Img({ attributes: { n: "book-page", "data-n": "book-page" }, src: computed(vm$.state.page, (page) => pictures[page + offset]), alt: computed(vm$.state.page, (page) => `第 ${page + offset + 1} 页`) })),
      Show({ when: vm$.state.flipping, ok: () => [
        Img({ attributes: { n: "book-flipping-page", "data-n": "book-flipping-page", "aria-hidden": "true", "data-direction": vm$.state.direction }, src: pictures[vm$.state.page.value + (vm$.state.direction.value > 0 ? 1 : 0)], alt: "" }),
      ] }),
    ]),
  ]);
}
