import { app, history, storage, client } from "@/store/index";
import { pages } from "@/store/views";

export function ApplicationModel() {
  const ready_ = ref(app.state.ready);
  const subviews_ = ref([...history.$view.subViews]);
  const tip_ = ref("");
  let timer;
  const listeners = [
    app.onStateChange(() => ready_.as(app.state.ready)),
    history.$view.onSubViewsChange((views) => subviews_.as([...views])),
    app.onTip(({ text }) => {
      clearTimeout(timer);
      tip_.as(text.join("\n"));
      timer = setTimeout(() => tip_.as(""), 1200);
    }),
  ];
  return {
    state: { ready: ready_, subviews: subviews_, tip: tip_ },
    props: { app, history, storage, client, pages },
    methods: {
      init() {
        history.$router.prepare(window.location);
        app.start({ width: window.innerWidth, height: window.innerHeight });
      },
      destroy() { clearTimeout(timer); for (const off of listeners) off(); },
    },
  };
}
