import Tesseract, { createWorker, OEM, PSM, Worker } from "tesseract.js";

import { ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { CanvasCore } from "@/biz/canvas";
import { file_request } from "@/biz/requests";
import { RequestCore } from "@/domains/request";
import { sleep } from "@/utils";

export function RecognizeCore(props: {
  app: ViewComponentProps["app"];
  $canvas: CanvasCore;
  onSubmit?: (v: { text: string }) => void;
}) {
  const { app, $canvas } = props;

  let _pending = false;
  let _worker1: null | Worker = null;
  let _result1: string[] = [];
  let _text: string | null = null;
  let _finish = false;
  const state = {
    get pending() {
      return _pending;
    },
    get text() {
      return _text;
    },
    get result() {
      return _result1;
    },
    get finish() {
      return _finish;
    },
  };

  $canvas.layers.grid.onMounted(() => {
    // $canvas.layers.grid.drawRect({ x: 0, y: 0, x1: $canvas.size.width, y1: $canvas.size.height });
    const size = $canvas.size.width / 2;
    const offset = 2;
    $canvas.layers.grid.drawLine(
      { x: $canvas.size.width / 2, y: offset },
      { x: $canvas.size.width / 2, y: $canvas.size.height - offset },
      { dash: true, color: "black" }
    );
    $canvas.layers.grid.drawLine(
      { x: offset, y: $canvas.size.height / 2 },
      { x: $canvas.size.width - offset, y: $canvas.size.height / 2 },
      { dash: true, color: "black" }
    );
    $canvas.layers.grid.drawRect(
      { x: offset, y: offset, x1: size * 2 - offset, y1: size * 2 - offset },
      { dash: true, color: "black" }
    );
  });
  $canvas.layers.path.onMounted(() => {
    $canvas.layers.path.setFillStyle("#fff");
    $canvas.layers.path.fillRect({ x: 0, y: 0, x1: $canvas.size.width, y1: $canvas.size.height });
  });
  $canvas.onPointerdown(() => {
    // $canvas.layers.path.save();
    $canvas.layers.path.moveTo($canvas.$pointer.x, $canvas.$pointer.y);
  });
  $canvas.onPointermove(() => {
    if (!$canvas.$pointer.pressing) {
      return;
    }
    $canvas.layers.path.drawTo($canvas.$pointer.position);
    // $canvas.layers.path.restore();
  });

  enum Events {
    Submit,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Submit]: { text: string };
    [Events.Change]: typeof state;
  };
  const bus = base<TheTypesOfEvents>();

  function onSubmit(handler: Handler<TheTypesOfEvents[Events.Submit]>) {
    return bus.on(Events.Submit, handler);
  }

  if (props.onSubmit) {
    onSubmit(props.onSubmit);
  }

  return {
    Symbol: "RecognizeCore" as const,
    state,
    $canvas,
    async recognize() {
      _finish = false;
      if (_pending) {
        return;
      }
      const url = $canvas.layers.path.getDataURI();
      _pending = true;
      bus.emit(Events.Change, { ...state });
      /**
       *    const lang = 'eng';
       *    const langPath = `https://unpkg.com/@tesseract.js-data/${lang}/4.0.0_best_int`;
       *    // A worker is created once and used every time a user uploads a new file.
       *    const worker = await Tesseract.createWorker(lang, 1, {
       *        corePath: 'https://unpkg.com/tesseract.js-core@v5',
       *        workerPath: 'https://unpkg.com/tesseract.js@v5/dist/worker.min.js',
       *        langPath: langPath,
       *        logger: function(m){console.log(m);}
       *    });
       */
      if (_worker1 === null) {
        // Step 2: Create a Blob object
        const r = await new RequestCore(() =>
          file_request.get<string>(
            "/worker.min.js",
            {},
            {
              headers: {
                ContentType: "text/plain; charset=utf-8",
              },
            }
          )
        ).run();
        if (r.error) {
          app.tip({
            text: [r.error.message],
          });
          return;
        }
        const jsCode = `globalThis.__TESSERACT_CORE_DOMAIN__ = "${window.location.origin}";${r.data}`;
        const blob = new Blob([jsCode], { type: "application/javascript" });
        // Step 3: Create a Blob URL
        const blobURL = URL.createObjectURL(blob);
        _worker1 = await createWorker("lt", OEM.LSTM_ONLY, {
          // langPath: "https://jp.t.funzm.com/"
          // workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${version}/dist/worker.min.js`,
          // workerPath: `/worker.min.js`,
          workerPath: blobURL,
        });
      }
      //       if (_worker2 === null) {
      //         _worker2 = await createWorker("jpn", OEM.LSTM_ONLY, {
      //           workerPath: `https://jp.t.funzm.com/worker.min.js`,
      //         });
      //       }
      _worker1.setParameters({
        // tessedit_char_whitelist:
        //   "あいうえおかきくけこさしすせそたちつてとにぬねのはひふへほまみむめもやゆよらりるれろわをん",
        tessedit_pageseg_mode: PSM.RAW_LINE,
      });
      // const ret = await Tesseract.recognize(url, "jpn");
      const { data: data1 } = await _worker1.recognize(url);
      //       const { data: data2 } = await _worker2.recognize(url);
      _pending = false;
      _result1 = data1.symbols
        .map((symbol) => {
          return symbol.choices.map((c) => c.text);
        })
        .reduce((t, arr) => {
          return t.concat(arr);
        }, [])
        .slice(0, 3);
      //       console.log("jps result", _result1);
      //       _result2 = data2.symbols
      //         .map((symbol) => {
      //           return symbol.choices.map((c) => c.text);
      //         })
      //         .reduce((t, arr) => {
      //           return t.concat(arr);
      //         }, []);
      //       console.log("jpn result", _result2);
      _finish = true;
      if (_result1.length === 1) {
        // _finish = false;
        _text = _result1[0];
        bus.emit(Events.Submit, { text: _text });
      }
      bus.emit(Events.Change, { ...state });
    },
    async select(text: string) {
      _text = text;
      bus.emit(Events.Submit, { text });
    },
    clear() {
      _result1 = [];
      _text = null;
      _finish = false;
      _pending = false;
      $canvas.layers.path.clear();
      bus.emit(Events.Change, { ...state });
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
    onSubmit,
  };
}

export type RecognizeCore = ReturnType<typeof RecognizeCore>;
