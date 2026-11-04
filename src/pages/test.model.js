export const pictures = Array.from({ length: 8 }, (_, index) => `/${240 + index}.jpg`);

export function BookPageModel() {
  const page_ = ref(0);
  const flipping_ = ref(false);
  const direction_ = ref(1);
  let timer;
  const methods = {
    turn(direction) {
      if (flipping_.value) return;
      const target = page_.value + direction * 2;
      if (target < 0 || target >= pictures.length) return;
      direction_.as(direction);
      flipping_.as(true);
      timer = setTimeout(() => { page_.as(target); flipping_.as(false); }, 500);
    },
    destroy() { clearTimeout(timer); },
  };
  return { state: { page: page_, flipping: flipping_, direction: direction_ }, methods, ui: {
    prev$: new Timeless.vm.ButtonCore({ onClick() { methods.turn(-1); } }),
    next$: new Timeless.vm.ButtonCore({ onClick() { methods.turn(1); } }),
  } };
}
