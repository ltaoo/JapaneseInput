# Local narration preview

Open http://127.0.0.1:3910/ while the local Vite server is running. Both Japanese stories use local audio and character timelines. Kuromoji part-of-speech colors show on unread text; playback fills the text red. Hover a character for its token, part of speech and reading.

Kanji in the transcript have hiragana ruby annotations derived from Kuromoji readings. Existing kana anchor the reading so okurigana is not repeated above the text (行き → 行／い, 友だち → 友／とも). Consecutive kanji share a reading (学校／がっこう); individual kanji readings are not guessed. Missing or unalignable readings are left unannotated. The original character buttons, timings and playback fill are preserved.

`vendor/kuromoji/` contains the browser bundle and IPADIC dictionary from [kuromoji.js](https://github.com/takuyaa/kuromoji.js), npm version 0.1.2, with its Apache 2.0 license and dictionary notices. Tokenization stays in the browser and makes no external requests. Tokens are mapped onto the original text without changing punctuation, combined small kana, sokuon or long-vowel timing. Automatic word analysis and estimated character boundaries can be imperfect.

Run the standalone checks with `node narration-preview/model.check.mjs` from the JapaneseInput repository root. No npm install is needed for these checks.

Start the preview with `./node_modules/.bin/vite narration-preview --config narration-preview/vite.config.mjs --host 127.0.0.1 --port 3910 --strictPort`. The preview's Vite config serves dictionary gzip bytes with identity HTTP encoding because Kuromoji performs its own decompression.

`exports/` preserves both original Japanese texts, WAV/MP3 audio, SRT/VTT/ASS subtitles, character timelines, alignment data and generation metadata. The files at this directory's root are the runtime copies used by the player. All runtime assets are local; VoiceStudio is not needed to play or test these stories.

The standalone Node checks use `model.check.mjs` so they are not discovered as a Vitest suite by the existing JapaneseInput application.
