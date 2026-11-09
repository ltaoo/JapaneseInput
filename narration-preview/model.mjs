const hiragana = (text) => text.normalize('NFKC').replace(/[ァ-ヶ]/gu, char => String.fromCodePoint(char.codePointAt(0) - 0x60));
const kanji = /[\p{Script=Han}々〆]/u;

function furigana(token) {
  if (!kanji.test(token.surface_form) || !token.reading || token.reading === '*') return [];
  const reading = hiragana(token.reading);
  if (!/^[\p{Script=Hiragana}ー]+$/u.test(reading)) return [];
  const parts = [...token.surface_form.matchAll(/[\p{Script=Han}々〆]+|[^\p{Script=Han}々〆]+/gu)];
  const pattern = parts.map(part => kanji.test(part[0]) ? '(.+?)' : hiragana(part[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
  const match = new RegExp(`^${pattern}$`, 'u').exec(reading);
  if (!match) return [];
  let group = 1;
  return parts.filter(part => kanji.test(part[0])).map(part => {
    const start = token.start + [...token.surface_form.slice(0, part.index)].length;
    return { text: part[0], reading: match[group++], start, end: start + [...part[0]].length };
  });
}

export class NarrationModel extends EventTarget {
  static loadTokenizer() {
    return new Promise((resolve, reject) => {
      globalThis.kuromoji.builder({ dicPath: './vendor/kuromoji/dict/' }).build((error, tokenizer) => error ? reject(error) : resolve(tokenizer));
    });
  }
  constructor(audio, timeline, stories = [], tokenizer = null) {
    super();
    this.audio = audio;
    this.stories = stories;
    this.story = stories[0] || null;
    this.loading = false;
    this.selection = 0;
    this.tokenizer = tokenizer;
    this.installTimeline(timeline);
    this.error = false;
    this.frame = null;
    for (const event of ['loadedmetadata', 'canplay', 'play', 'pause', 'ended', 'seeking', 'seeked', 'ratechange', 'timeupdate', 'error']) {
      audio.addEventListener(event, () => {
        if (event === 'error') this.error = true;
        this.notify();
        if (event === 'play') this.tick();
      });
    }
  }
  installTimeline(timeline) {
    if (!Number.isFinite(timeline.duration) || timeline.duration <= 0) throw new Error('Invalid timeline duration');
    const source = [...timeline.text];
    for (const [index, cue] of timeline.characters.entries()) {
      if (!Number.isInteger(cue.index) || source[cue.index] !== cue.text || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.start < 0 || cue.end <= cue.start || cue.end > timeline.duration || (index && (cue.start < timeline.characters[index - 1].end || cue.index <= timeline.characters[index - 1].index))) throw new Error('Invalid character timeline');
    }
    // Match surfaces against the original text to preserve Unicode indices and whitespace.
    let cursor = 0;
    const tokens = (this.tokenizer?.tokenize(timeline.text) || []).map((token) => {
      const offset = timeline.text.indexOf(token.surface_form, cursor);
      if (!token.surface_form || offset < cursor || timeline.text.slice(cursor, offset).trim()) throw new Error('Invalid token alignment');
      const start = [...timeline.text.slice(0, offset)].length;
      cursor = offset + token.surface_form.length;
      const aligned = { ...token, start, end: start + [...token.surface_form].length };
      return { ...aligned, ruby: furigana(aligned) };
    });
    if (this.tokenizer && timeline.text.slice(cursor).trim()) throw new Error('Incomplete token alignment');
    this.timeline = timeline;
    this.tokens = tokens;
    this.partsOfSpeech = [...new Set(tokens.filter(token => token.pos !== '記号').map(token => token.pos))];
    const byIndex = new Map(timeline.characters.map((cue) => [cue.index, cue]));
    if (source.some((char, index) => /[\p{L}\p{N}]/u.test(char) && !byIndex.has(index))) throw new Error('Incomplete character timeline');
    this.units = [];
    this.glyphs = [];
    let position = 0;
    let leftUnit = null;
    this.paragraphs = timeline.text.split('\n\n').map((paragraph) => {
      const glyphs = [];
      for (const text of paragraph) {
        const cue = byIndex.get(position);
        const previous = glyphs.at(-1);
        if (cue && /^[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]$/u.test(text) && previous?.kind === 'speech' && /^[ぁ-ゖァ-ヺ]+$/u.test(previous.text) && !/[っッ]$/u.test(previous.text) && previous.indices.at(-1) === position - 1) {
          previous.text += text;
          previous.indices.push(position);
          previous.cue.end = cue.end;
          previous.cue.estimated ||= cue.estimated;
        } else {
          const punctuation = !cue && /^\p{P}$/u.test(text);
          const token = tokens.find(token => token.start <= position && position < token.end) || null;
          const glyph = { text, index: position, indices: [position],
            token, ruby: token?.ruby.find(part => part.start <= position && position < part.end) || null,
            kind: cue ? 'speech' : punctuation ? 'punctuation' : 'spacing',
            cue: cue ? { ...cue } : punctuation ? { start: leftUnit?.cue.end || 0, end: leftUnit?.cue.end || 0, instant: true } : null,
            unitIndex: cue ? this.units.length : null };
          glyphs.push(glyph);
          this.glyphs.push(glyph);
          if (cue) { this.units.push(glyph); leftUnit = glyph; }
        }
        position++;
      }
      position += 2;
      return glyphs;
    });
  }
  get state() {
    const time = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0;
    const at = (cue) => cue.start <= time && time < cue.end;
    const active = this.units.findIndex((unit) => at(unit.cue));
    const fillAt = (cue) => !cue ? 0 : cue.instant ? Number(time >= cue.start) : Math.min(1, Math.max(0, (time - cue.start) / (cue.end - cue.start)));
    return {
      time, duration: this.timeline.duration, paused: this.audio.paused,
      ready: !this.loading && !this.error && this.audio.readyState >= 1, error: this.error, rate: this.audio.playbackRate,
      loading: this.loading, story: this.story, timeline: this.timeline, active,
      activeText: this.units[active]?.text || '·', activeFill: fillAt(this.units[active]?.cue),
      activePos: this.units[active]?.token?.pos || '',
      unitCount: this.units.length,
      fills: this.units.map((unit) => fillAt(unit.cue)),
      glyphs: this.glyphs.map((glyph) => ({ ...glyph, fill: fillAt(glyph.cue), state: glyph.unitIndex !== null && glyph.unitIndex === active ? 'active' : glyph.cue && time >= glyph.cue.end ? 'past' : 'future' })),
      sentence: this.timeline.sentences.findIndex(at),
      word: this.units[active]?.token?.surface_form || this.timeline.words.find(at)?.text || '',
    };
  }
  notify() { this.dispatchEvent(new Event('change')); }
  tick() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.notify();
      if (!this.audio.paused) this.tick();
    });
  }
  async toggle() {
    if (this.loading) return;
    if (!this.audio.paused) return this.audio.pause();
    if (this.audio.ended) this.seek(0);
    const selection = this.selection;
    try { await this.audio.play(); if (selection === this.selection) this.error = false; }
    catch { if (selection === this.selection) this.error = true; }
    this.notify();
  }
  seek(time) {
    if (this.loading || !Number.isFinite(time)) return;
    this.audio.currentTime = Math.min(this.timeline.duration, Math.max(0, time));
    this.notify();
  }
  seekCharacter(index) {
    const unit = this.units.find((unit) => unit.indices.includes(index));
    if (unit) this.seek(unit.cue.start);
  }
  async selectStory(id) {
    const story = this.stories.find((story) => story.id === id);
    if (!story || (story === this.story && !this.loading && !this.error)) return;
    this.audio.pause();
    const selection = ++this.selection;
    this.story = story;
    this.loading = true;
    this.error = false;
    this.notify();
    try {
      const response = await fetch(story.timeline);
      if (!response.ok) throw new Error('Story timeline unavailable');
      const timeline = await response.json();
      if (selection !== this.selection) return;
      this.installTimeline(timeline);
      this.audio.src = story.audio;
      this.audio.currentTime = 0;
      this.audio.load();
    } catch {
      if (selection === this.selection) this.error = true;
    } finally {
      if (selection === this.selection) { this.loading = false; this.notify(); }
    }
  }
  setRate(rate) {
    if ([0.75, 1, 1.25].includes(rate)) {
      this.audio.defaultPlaybackRate = rate;
      this.audio.playbackRate = rate;
    }
  }
}
