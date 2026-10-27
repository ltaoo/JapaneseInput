import * as Timeless from "@timeless/timeless";
import * as Shadcn from "@timeless/shadcn";
import "@timeless/shadcn/globals.css";

Timeless.registerIcons({
  mic: {
    tag: "svg",
    attrs: { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" },
    children: [
      { tag: "rect", attrs: { n: "microphone-head", x: "9", y: "2", width: "6", height: "12", rx: "3" } },
      { tag: "path", attrs: { n: "microphone-stand", d: "M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" } },
    ],
  },
});
Object.assign(globalThis, Timeless, Shadcn, { Timeless });
