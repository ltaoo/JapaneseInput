import { InputCore } from "./index";

export function connect(store: InputCore<string>, $input: HTMLInputElement | HTMLTextAreaElement) {
  store.focus = () => {
    $input.focus();
  };
  store.getCursorIndex = () => [$input.selectionStart ?? 0, $input.selectionEnd ?? 0];
  store.setCursorIndex = (index: number) => $input.setSelectionRange(index, index);
  store.getCursorPosition = () => {
    const rect = $input.getBoundingClientRect();
    const style = window.getComputedStyle($input);
    const mirror = document.createElement("div");
    mirror.setAttribute("data-n", "input-cursor-mirror");
    mirror.style.cssText = `position:fixed;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;box-sizing:border-box;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;`;
    for (const key of ["font", "line-height", "letter-spacing", "padding", "border-width", "border-style", "text-indent", "tab-size"]) {
      mirror.style.setProperty(key, style.getPropertyValue(key));
    }
    mirror.textContent = $input.value.slice(0, $input.selectionStart ?? 0);
    const caret = document.createElement("span");
    caret.setAttribute("data-n", "input-cursor-marker");
    caret.textContent = "\u200b";
    mirror.appendChild(caret);
    document.body.appendChild(mirror);
    try {
      const cursor = caret.getBoundingClientRect();
      return { x: cursor.left - $input.scrollLeft, y: cursor.bottom - $input.scrollTop };
    } finally {
      mirror.remove();
    }
  };
}
