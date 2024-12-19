import { InputCore } from "./index";

export function connect(store: InputCore<string>, $input: HTMLInputElement | HTMLTextAreaElement) {
  store.focus = () => {
    $input.focus();
  };

}
