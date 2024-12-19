import {
  a,
  i,
  u,
  e,
  o,
  ka,
  ki,
  ku,
  ke,
  ko,
  kya,
  kyu,
  kyo,
  sa,
  si,
  su,
  se,
  so,
  sya,
  syu,
  syo,
  ta,
  ti,
  tu,
  te,
  to,
  cya,
  cyu,
  cyo,
  na,
  ni,
  nu,
  ne,
  no,
  nya,
  nyu,
  nyo,
  wn,
  ha,
  hi,
  hu,
  he,
  ho,
  hya,
  hyu,
  hyo,
  ma,
  mi,
  mu,
  me,
  mo,
  mya,
  myu,
  myo,
  ya,
  yu,
  yo,
  ra,
  ri,
  ru,
  re,
  ro,
  rya,
  ryu,
  ryo,
  wa,
  wo,
  ga,
  gi,
  gu,
  ge,
  go,
  gya,
  gyu,
  gyo,
  za,
  zu,
  ze,
  zo,
  zi,
  jya,
  jyu,
  jyo,
  da,
  di,
  du,
  de,
  _do,
  ba,
  bi,
  bu,
  be,
  bo,
  bya,
  byu,
  byo,
  pa,
  pi,
  pu,
  pe,
  po,
  pya,
  pyu,
  pyo,
  yi,
  ye,
  nn,
  wi,
  wu,
  we,
  tt,
} from "./ming";

export type JPChar = {
  id: string;
  // 平假名
  pin: string;
  // 平假名笔画
  pin_count: number;
  // 片假名
  pian: string;
  // 片假名笔画
  pian_count: number;
  // 发音
  // voice: string;
  // 罗马字
  luo: string;
  // 是否是占位
  placeholder?: boolean;
};
export type NestedJPChar = {
  [key: string]: JPChar | NestedJPChar;
};
export const jp_chars2: NestedJPChar = {
  a: a,
  i: i,
  u: u,
  e: e,
  o: o,
  k: {
    a: ka,
    i: ki,
    u: ku,
    e: ke,
    o: ko,
    y: {
      a: kya,
      u: kyu,
      o: kyo,
    },
  },
  s: {
    a: sa,
    i: si,
    h: {
      i: si,
    },
    u: su,
    e: se,
    o: so,
    y: {
      a: sya,
      u: syu,
      o: syo,
    },
  },
  t: {
    a: ta,
    i: ti,
    u: tu,
    s: {
      u: tu,
    },
    t: tt,
    e: te,
    o: to,
  },
  c: {
    y: {
      a: cya,
      // t 的特殊
      i: ti,
      u: cyu,
      o: cyo,
    },
    h: {
      a: cya,
      // t 的特殊
      i: ti,
      u: cyu,
      o: cyo,
    },
  },
  n: {
    a: na,
    i: ni,
    u: nu,
    e: ne,
    o: no,
    y: {
      a: nya,
      u: nyu,
      o: nyo,
    },
    n: wn,
  },
  h: {
    a: ha,
    i: hi,
    u: hu,
    e: he,
    o: ho,
    y: {
      a: hya,
      u: hyu,
      o: hyo,
    },
  },
  m: {
    a: ma,
    i: mi,
    u: mu,
    e: me,
    o: mo,
    y: {
      a: mya,
      u: myu,
      o: myo,
    },
  },
  y: {
    a: ya,
    u: yu,
    o: yo,
  },
  r: {
    a: ra,
    i: ri,
    u: ru,
    e: re,
    o: ro,
    y: {
      a: rya,
      u: ryu,
      o: ryo,
    },
  },
  w: {
    a: wa,
    n: wn,
    o: wo,
  },
  // 浊音
  g: {
    a: ga,
    i: gi,
    u: gu,
    e: ge,
    o: go,
    y: {
      a: gya,
      u: gyu,
      o: gyo,
    },
  },
  z: {
    a: za,
    u: zu,
    e: ze,
    o: zo,
  },
  j: {
    // z 的特殊，但是 di 和 zi 一样，罗马音都是 ji 怎么办。那就 ji 对应 zi，di 只能通过 di 输入。
    i: zi,
    a: jya,
    u: jyu,
    o: jyo,
  },
  d: {
    a: da,
    i: di,
    u: du,
    e: de,
    o: _do,
  },
  b: {
    a: ba,
    i: bi,
    u: bu,
    e: be,
    o: bo,
    y: {
      a: bya,
      u: byu,
      o: byo,
    },
  },
  p: {
    a: pa,
    i: pi,
    u: pu,
    e: pe,
    o: po,
    y: {
      a: pya,
      u: pyu,
      o: pyo,
    },
  },
  l: {
    l: tt,
  },
};
export const jp_chars_in_sort1: JPChar[] = [
  a,
  i,
  u,
  e,
  o,
  ka,
  ki,
  ku,
  ke,
  ko,
  sa,
  si,
  su,
  se,
  so,
  ta,
  ti,
  tu,
  te,
  to,
  na,
  ni,
  nu,
  ne,
  no,
  ha,
  hi,
  hu,
  he,
  ho,
  ma,
  mi,
  mu,
  me,
  mo,
  ya,
  yi,
  yu,
  ye,
  yo,
  ra,
  ri,
  ru,
  re,
  ro,
  wa,
  wi,
  wu,
  we,
  wo,
  nn,
  tt,
];
export const jp_chars_in_sort2: JPChar[] = [
  ga,
  gi,
  gu,
  ge,
  go,
  za,
  zi,
  zu,
  ze,
  zo,
  da,
  di,
  du,
  de,
  _do,
  ba,
  bi,
  bu,
  be,
  bo,
  pa,
  pi,
  pu,
  pe,
  po,
];
export const jp_chars_in_sort3: JPChar[] = [
  kya,
  kyu,
  kyo,
  gya,
  gyu,
  gyo,
  sya,
  syu,
  syo,
  jya,
  jyu,
  jyo,
  cya,
  cyu,
  cyo,
  nya,
  nyu,
  nyo,
  hya,
  hyu,
  hyo,
  bya,
  byu,
  byo,
  pya,
  pyu,
  pyo,
  mya,
  myu,
  myo,
  rya,
  ryu,
  ryo,
];
export const jp_chars_in_sort1_grouped_by_pin_count = [...jp_chars_in_sort1]
  .filter((char) => !char.placeholder)
  .reduce((acc, item) => {
    // 查找当前 pin_count 是否已经存在于累加器中
    const group = acc.find((g) => g.sort === item.pin_count);
    // 如果找到了对应的组，就将当前对象添加进去
    if (group) {
      group.chars.push(item);
    } else {
      // 如果没有找到，就新建一个组
      acc.push({
        sort: item.pin_count,
        chars: [item],
      });
    }
    return acc;
  }, [] as { sort: number; chars: JPChar[] }[])
  .sort((a, b) => a.sort - b.sort);
export const jp_chars_in_sort1_grouped_by_pian_count = [...jp_chars_in_sort1]
  .filter((char) => !char.placeholder)
  .reduce((acc, item) => {
    // 查找当前 pin_count 是否已经存在于累加器中
    const group = acc.find((g) => g.sort === item.pian_count);
    // 如果找到了对应的组，就将当前对象添加进去
    if (group) {
      group.chars.push(item);
    } else {
      // 如果没有找到，就新建一个组
      acc.push({
        sort: item.pian_count,
        chars: [item],
      });
    }
    return acc;
  }, [] as { sort: number; chars: JPChar[] }[])
  .sort((a, b) => a.sort - b.sort);
