import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@timeless/timeless-dom";
import { JapaneseInputCore } from "@/biz/japanese_input";
import { JapaneseInput } from "@/components/JapaneseInput/index.js";
import HomePageView from "@/pages/home/index.js";
import { WordChallengePageModel } from "@/pages/home/challenge2.model.js";
import { HiraganaChallengePageModel } from "@/pages/home/challenge1.model.js";
import { AnalysisPageModel } from "@/pages/home/analysis.model.js";
import { AuthPageModel } from "@/pages/auth.model.js";
import { DrawingManagePageModel } from "@/pages/home/manage.model.js";
import { StorageCore } from "@/domains/storage";
import { words } from "@/pages/home/words.js";
import { CanvasView } from "@/components/Canvas/index.js";
import { CanvasCore } from "@/biz/canvas";
import JSZip from "jszip";

const mounted = [];
const app = { tip: vi.fn() };
async function mount(element) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  render(element, root);
  mounted.push({ element, root });
  await new Promise((resolve) => setTimeout(resolve, 5));
  return root;
}
function key(element, code, value) {
  element.dispatchEvent(new KeyboardEvent("keydown", { key: value, code, bubbles: true, cancelable: true }));
  element.dispatchEvent(new KeyboardEvent("keyup", { key: value, code, bubbles: true }));
}
afterEach(() => {
  for (const { element, root } of mounted.splice(0)) { destroyElement(element); root.remove(); }
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  app.tip.mockClear();
});

describe("Timeless migration", () => {
  it("waits for hidden routes to become measurable before mounting canvas layers", async () => {
    let notify;
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback) { notify = callback; }
      observe() {}
      disconnect() { disconnect(); }
    });
    const context = {};
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const store = CanvasCore({});
    const root = await mount(CanvasView({ store }));
    expect(store.mounted).toBe(false);
    const element = root.querySelector('[data-n="handwriting-canvas"]');
    Object.defineProperties(element, { clientWidth: { value: 210 }, clientHeight: { value: 210 } });
    notify();
    expect(store.mounted).toBe(true);
    expect([...element.querySelectorAll("canvas")].map((canvas) => [canvas.width, canvas.height])).toEqual([[210, 210], [210, 210]]);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("switches kana tables and keeps pronunciation URLs", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const root = await mount(HomePageView({ app }));
    root.querySelector('[data-n="kana-chart-character"]').click();
    expect(root.querySelector("audio").getAttribute("src")).toBe("/voices/a.mp3");
    expect(play).toHaveBeenCalledOnce();
    const tabs = root.querySelectorAll('[data-n="kana-chart-tab"]');
    tabs[1].click();
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(root.querySelectorAll('[data-n="kana-chart"]')[1].style.display).toBe("grid");
    tabs[2].click();
    expect(root.querySelectorAll('[data-n="kana-chart"]')[2].textContent).toContain("きゃ");
  });

  it("converts romaji, selects katakana and inserts at the current selection", async () => {
    const store = JapaneseInputCore({ app });
    store.init = vi.fn();
    const enter = vi.fn();
    store.onEnter(enter);
    const root = await mount(JapaneseInput({ store }));
    const input = root.querySelector("textarea");
    input.focus();
    key(input, "KeyA", "a");
    key(input, "KeyO", "o");
    expect(root.querySelector('[data-n="composition-panel"]').textContent).toBe("あお");
    key(input, "Tab", "Tab");
    expect(root.querySelectorAll('[data-n="conversion-option"]').length).toBe(2);
    root.querySelector('[data-n="conversion-option"]').click();
    expect(store.state.isSelecting).toBe(true);
    key(input, "ArrowDown", "ArrowDown");
    key(input, "Enter", "Enter");
    expect(input.value).toBe("アオ");
    expect(store.value).toBe("アオ");
    expect(enter).not.toHaveBeenCalled();
    input.setSelectionRange(0, 1);
    key(input, "KeyI", "i");
    key(input, "Space", " ");
    expect(input.value).toBe("いオ");
    key(input, "Enter", "Enter");
    expect(enter).toHaveBeenCalledOnce();
    expect(store.init).toHaveBeenCalledOnce();
  });

  it("checks words, waits before advancing, and completes without overrunning", () => {
    vi.useFakeTimers();
    const model = WordChallengePageModel({ app });
    model.ui.input$.focus = vi.fn();
    model.ui.input$.ui.$input.setValue("错误答案");
    model.methods.submit();
    expect(model.state.correct.value).toBe(false);
    for (let i = 0; i < words.length; i++) {
      const question = words.find((word) => word.meaning === model.state.meaning.value);
      model.ui.input$.ui.$input.setValue(i % 2 ? question.word : question.hiragana);
      model.methods.submit();
      model.methods.submit();
      expect(model.state.correct.value).toBe(true);
      expect(model.state.index.value).toBe(i + 1);
      vi.advanceTimersByTime(2000);
    }
    expect(model.state.completed.value).toBe(true);
    expect(model.state.progress.value).toBe(100);
    expect(model.state.index.value).toBe(words.length);
    model.methods.destroy();
  });

  it("cleans up pending challenge transitions on destruction", () => {
    vi.useFakeTimers();
    const model = WordChallengePageModel({ app });
    model.ui.input$.focus = vi.fn();
    model.ui.input$.ui.$input.setValue(words.find((word) => word.meaning === model.state.meaning.value).hiragana);
    model.methods.submit();
    model.methods.destroy();
    vi.advanceTimersByTime(2000);
    expect(model.state.index.value).toBe(1);
  });

  it("preserves hiragana hints and recognizes a correct candidate", async () => {
    vi.useFakeTimers();
    const model = HiraganaChallengePageModel({ app });
    model.ui.recognize$.$canvas.layers.path.clear = vi.fn();
    model.ui.audio$.play = vi.fn();
    model.methods.tip();
    const answer = app.tip.mock.calls.at(-1)[0].text[0];
    await model.ui.recognize$.select("wrong");
    expect(model.state.correct.value).toBe(false);
    await model.ui.recognize$.select(answer);
    expect(model.state.correct.value).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(model.state.index.value).toBe(2);
    expect(model.ui.audio$.play).toHaveBeenCalledOnce();
    model.methods.destroy();
  });

  it("keeps sentence analysis validation and the existing example result", () => {
    const model = AnalysisPageModel({ app });
    model.methods.submit();
    expect(app.tip).toHaveBeenCalledWith({ text: ["请先输入要分析的内容"] });
    model.ui.input$.setValue("以下で実現できたので本書をノウハウとして共有しておく");
    model.methods.submit();
    expect(model.state.analysis.value.segments.map((s) => s.text).join("")).toBe(model.ui.input$.value);
    expect(model.state.analysis.value.explain).toContain("诀窍");
  });

  it("uses the existing account service and restores the loading state", async () => {
    const user = { inputEmail: vi.fn(), inputPassword: vi.fn(), login: vi.fn().mockResolvedValue({ error: null }), register: vi.fn().mockResolvedValue({ error: null }) };
    const model = AuthPageModel({ app: { ...app, $user: user } });
    model.ui.email$.setValue("test@example.com");
    model.ui.password$.setValue("password");
    await model.methods.submit();
    expect(user.inputEmail).toHaveBeenCalledWith("test@example.com");
    expect(user.inputPassword).toHaveBeenCalledWith("password");
    expect(user.login).toHaveBeenCalledOnce();
    expect(model.ui.submit$.state.loading).toBe(false);
    const register = AuthPageModel({ app: { ...app, $user: user } }, true);
    await register.methods.submit();
    expect(user.register).toHaveBeenCalledOnce();
    expect(app.tip).toHaveBeenCalledWith({ text: ["注册成功"] });
  });

  it("reads old drawing records and deletes only selected records", () => {
    vi.useFakeTimers();
    const values = { user: { token: "existing-token" }, canvas: ["data:image/png;base64,YQ==", "data:image/png;base64,Yg=="] };
    const storage = new StorageCore({ key: "global", defaultValues: { user: {}, canvas: [] }, values, client: { setItem: vi.fn(), getItem: vi.fn() } });
    const off = vi.fn();
    const model = DrawingManagePageModel({ app, storage, view: { onShow: () => off } });
    expect(model.state.drawings.value).toEqual(values.canvas);
    model.methods.remove(values.canvas[0]);
    vi.runAllTimers();
    expect(model.state.drawings.value).toEqual([values.canvas[1]]);
    expect(storage.get("user").token).toBe("existing-token");
    model.methods.clear();
    expect(model.state.drawings.value).toEqual([]);
    model.methods.destroy();
    expect(off).toHaveBeenCalledOnce();
  });

  it("exports the original records with their existing ZIP filenames", async () => {
    let blob;
    let filename;
    const OriginalURL = URL;
    vi.stubGlobal("URL", class extends OriginalURL {
      static createObjectURL(value) { blob = value; return "blob:test-drawings"; }
      static revokeObjectURL() {}
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { filename = this.download; });
    const model = DrawingManagePageModel({ app, storage: { get: () => ["data:image/png;base64,YQ=="], onStateChange: () => () => {} }, view: { onShow: () => () => {} } });
    await model.methods.download();
    expect(filename).toBe("a.zip");
    const data = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsArrayBuffer(blob); });
    const zip = await JSZip.loadAsync(data);
    expect(await zip.file("a_1.png").async("string")).toBe("a");
    model.methods.destroy();
  });
});
