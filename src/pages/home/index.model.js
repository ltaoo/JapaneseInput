import { Gojūon_in_sort1, VoicedSounds_in_sort1, Yōon_in_sort1 } from "@/biz/japanese_input/constants";
import { AudioCore } from "@/domains/audio";

/** @param {ViewComponentProps} props */
export function HomePageModel(props) {
  const table_ = ref(0);
  const audio$ = AudioCore();
  const tables = [
    { title: "五十音", chars: Gojūon_in_sort1, columns: 5 },
    { title: "浊音", chars: VoicedSounds_in_sort1, columns: 5 },
    { title: "拗音", chars: Yōon_in_sort1, columns: 3 },
  ];
  return {
    state: { table: table_ },
    tables,
    ui: { audio$ },
    methods: {
      selectTable(index) { table_.as(index); },
      play(char) {
        if (char.placeholder) return;
        audio$.setURL(`/voices/${char.id}.mp3`);
        audio$.play();
      },
    },
  };
}
