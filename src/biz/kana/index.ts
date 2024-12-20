import { JPChar } from "@/biz/japanese_input/constants";

export function KanaCore(props: JPChar) {
  return {
    voice() {
      if (props.placeholder) {
        return null;
      }
      return `/voices/${props.id}.mp3`;
    },
  };
}

export type KanaCore = ReturnType<typeof KanaCore>;
