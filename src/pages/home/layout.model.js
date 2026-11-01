/** @param {ViewComponentProps} props */
export function HomeLayoutModel({ view, history }) {
  const subviews_ = ref([...view.subViews]);
  const current_ = ref(view.curView?.name);
  const listeners = [
    view.onSubViewsChange((views) => subviews_.as([...views])),
    view.onCurViewChange((child) => current_.as(child.name)),
  ];
  return {
    state: { subviews: subviews_, current: current_ },
    menu: [
      { name: "root.home_layout.index", title: "首页" },
      { name: "root.home_layout.challenge1", title: "平假名挑战" },
      { name: "root.home_layout.challenge2", title: "单词挑战" },
    ],
    methods: {
      navigate(name) { history.push(name); },
      destroy() { for (const off of listeners) off(); },
    },
  };
}
