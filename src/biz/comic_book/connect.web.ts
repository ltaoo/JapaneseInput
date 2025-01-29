import { ComicBookPage } from "./page";

export function connect(store: ComicBookPage<any>, $page: HTMLDivElement, $wrap: HTMLDivElement) {
  store.$wrap.bind({
    css(styles) {
      Object.assign($wrap.style, styles);
    },
    transform(transform: string) {
      $wrap.style.transform = transform;
    },
  });
  store.$page.bind({
    css(styles) {
      Object.assign($page.style, styles);
    },
    transform(transform: string) {
      $page.style.transform = transform;
    },
  });
}
