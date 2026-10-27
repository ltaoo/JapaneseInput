import { afterEach, expect, it, vi } from "vitest";
import { createWorker } from "tesseract.js";
import { RecognizeCore } from "@/biz/recognize";
import { CanvasCore } from "@/biz/canvas";

vi.mock("tesseract.js", () => ({ default: {}, createWorker: vi.fn(), OEM: { LSTM_ONLY: 1 }, PSM: { RAW_LINE: 13 } }));
vi.mock("@/domains/request", () => ({ RequestCore: class { async run() { return { data: "/* worker */", error: null }; } } }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("releases a worker and its blob URL, and recovers from OCR failures", async () => {
  const revoke = vi.fn();
  const OriginalURL = URL;
  vi.stubGlobal("URL", class extends OriginalURL {
    static createObjectURL() { return "blob:test-worker"; }
    static revokeObjectURL = revoke;
  });
  const worker = { setParameters: vi.fn(), recognize: vi.fn().mockRejectedValue(new Error("OCR failed")), terminate: vi.fn().mockResolvedValue(undefined) };
  vi.mocked(createWorker).mockResolvedValue(worker as any);
  const app = { tip: vi.fn() };
  const canvas = CanvasCore({});
  canvas.layers.path.getDataURI = () => "data:image/png;base64,YQ==";
  const model = RecognizeCore({ app: app as any, $canvas: canvas });
  await model.recognize();
  expect(model.state.pending).toBe(false);
  expect(app.tip).toHaveBeenCalledWith({ text: ["OCR failed"] });
  expect(revoke).toHaveBeenCalledWith("blob:test-worker");
  model.destroy();
  expect(worker.terminate).toHaveBeenCalledOnce();
});
