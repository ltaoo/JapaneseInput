import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';
import { NarrationModel } from './model.mjs';

globalThis.requestAnimationFrame = () => 1;
class AudioStub extends EventTarget {
  currentTime = 0;
  readyState = 2;
  paused = true;
  ended = false;
  playbackRate = 1;
  async play() { this.paused = false; this.dispatchEvent(new Event('play')); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  load() { this.readyState = 2; this.ended = false; this.dispatchEvent(new Event('loadedmetadata')); }
}
const timeline = JSON.parse(readFileSync(new URL('./timeline.json', import.meta.url)));
const audio = new AudioStub();
const model = new NarrationModel(audio, timeline);
assert.equal(model.state.active, 0);
assert.equal(model.units.length, 111);
assert.equal(model.paragraphs.map(p => p.map(g => g.text).join('')).join('\n\n'), timeline.text);
model.seek(1.9);
assert.equal(model.state.active, -1, 'Silence must not highlight a character');
const comma = model.glyphs.find(glyph => glyph.text === '、');
const punctuationFill = () => model.state.glyphs.find(glyph => glyph.index === comma.index).fill;
model.seek(comma.cue.start - .001);
assert.equal(punctuationFill(), 0);
model.seek(comma.cue.start);
assert.equal(punctuationFill(), 1, 'Punctuation must fill immediately after the left character completes');
model.seek(comma.cue.start - .001);
assert.equal(punctuationFill(), 0, 'Seeking backward must reset punctuation');
const cat = timeline.characters.find(cue => cue.text === '猫');
const catPosition = timeline.characters.indexOf(cat);
model.seek((cat.start + cat.end) / 2);
assert.ok(Math.abs(model.state.fills[catPosition] - .5) < 1e-9, 'Halfway through a character must fill half its width');
assert.equal(model.state.fills[catPosition - 1], 1);
assert.equal(model.state.fills[catPosition + 1], 0);
model.seek(cat.end);
assert.equal(model.state.fills[catPosition], 1);
model.seek(cat.start - .01);
assert.equal(model.state.fills[catPosition], 0, 'Seeking backward must clear future fill');
model.seekCharacter(cat.index);
assert.equal(audio.currentTime, cat.start);
assert.equal(timeline.characters[model.state.active].text, '猫');
model.seek(-2);
assert.equal(audio.currentTime, 0);
model.seek(Infinity);
assert.equal(audio.currentTime, 0);
model.seek(1000);
assert.equal(audio.currentTime, timeline.duration);
assert.equal(model.state.active, -1);
model.setRate(.75);
assert.equal(audio.playbackRate, .75);
const pausedFills = model.state.fills;
model.setRate(1.25);
assert.deepEqual(model.state.fills, pausedFills, 'Rate changes must not move the fill without moving audio time');
model.setRate(.75);
model.setRate(100);
assert.equal(audio.playbackRate, .75);
await model.toggle();
assert.equal(model.state.paused, false);
await model.toggle();
assert.equal(model.state.paused, true);
audio.play = async () => { throw new Error('Playback rejected'); };
await model.toggle();
assert.equal(model.state.error, true);
const invalid = structuredClone(timeline);
invalid.characters[0].end = -1;
assert.throws(() => new NarrationModel(new AudioStub(), invalid), /Invalid character/);

const sample = '「きゃ、きゅ。きょ！がっこう、コーヒー、一。」';
let at = 0;
const fixtureCharacters = [...sample].flatMap((text, index) => {
  if (!/[\p{L}\p{N}]/u.test(text)) return [];
  const start = at++ / 5;
  return [{ text, index, start, end: at / 5, estimated: false }];
});
const fixture = {text:sample,duration:at/5+1,characters:fixtureCharacters,words:[],sentences:[]};
const kana = new NarrationModel(new AudioStub(), fixture);
for (const text of ['きゃ','きゅ','きょ']) {
  const unit = kana.units.find(unit => unit.text === text);
  assert.ok(unit, `Contracted kana must form one reading unit: ${text}`);
  assert.equal(unit.indices.length, 2);
  kana.seek((unit.cue.start+unit.cue.end)/2);
  assert.equal(kana.state.activeText, text);
  assert.ok(Math.abs(kana.state.activeFill-.5)<1e-9);
  kana.seekCharacter(unit.indices[1]);
  assert.equal(kana.state.time, unit.cue.start, 'Small kana seeks to the shared syllable start');
}
for(const text of ['っ','ー','一']){
  const unit=kana.units.find(unit=>unit.text===text);
  assert.ok(unit&&!unit.cue.instant&&unit.cue.end>unit.cue.start, `${text} must retain pronunciation duration`);
}
assert.equal(kana.glyphs[0].cue.instant,true,'A leading quote is punctuation');
assert.equal(kana.state.glyphs[0].fill,1);

const stories=JSON.parse(readFileSync(new URL('./stories.json',import.meta.url)));
const cafe=JSON.parse(readFileSync(new URL('./cafe.timeline.json',import.meta.url)));
const switchingAudio=new AudioStub();
const switching=new NarrationModel(switchingAudio,timeline,stories);
globalThis.fetch=async()=>({ok:true,json:async()=>cafe});
await switching.toggle();
switching.setRate(.75);
await switching.selectStory('cafe');
assert.equal(switching.state.paused,true);
assert.equal(switching.state.time,0);
assert.equal(switching.state.story.id,'cafe');
assert.equal(switchingAudio.src,'./cafe.wav');
assert.equal(switching.state.rate,.75);
assert.ok(switching.units.some(unit=>unit.text==='きょ'));
assert.equal(switching.paragraphs.map(p=>p.map(g=>g.text).join('')).join('\n\n'),cafe.text);
const pending=[];
globalThis.fetch=url=>new Promise(resolve=>pending.push({url,resolve}));
const older=switching.selectStory('school-cat');
const latest=switching.selectStory('cafe');
pending[1].resolve({ok:true,json:async()=>cafe});
await latest;
pending[0].resolve({ok:true,json:async()=>timeline});
await older;
assert.equal(switching.state.story.id,'cafe','A stale response must not replace the latest story');
assert.equal(switching.timeline,cafe);
globalThis.fetch=async()=>{throw new Error('Failed fetch');};
await switching.selectStory('school-cat');
assert.equal(switching.state.error,true);
assert.equal(switching.state.ready,false);

// Exercise the exact browser bundle and dictionary without a server or installed packages.
globalThis.XMLHttpRequest = class {
  open(method, url) { this.url = url; }
  send() {
    queueMicrotask(() => {
      try {
        this.response = Uint8Array.from(readFileSync(new URL(this.url, import.meta.url))).buffer;
        this.status = 200;
        this.onload();
      } catch (error) { this.onerror(error); }
    });
  }
};
runInThisContext(readFileSync(new URL('./vendor/kuromoji/kuromoji.js', import.meta.url), 'utf8'));
const tokenizer = await NarrationModel.loadTokenizer();
for (const [surface_form, reading, expected] of [
  ['学校', 'ガッコウ', [['学校', 'がっこう']]],
  ['大人', 'オトナ', [['大人', 'おとな']]],
  ['行き', 'イキ', [['行', 'い']]],
  ['小さい', 'チイサイ', [['小', 'ちい']]],
  ['友だち', 'トモダチ', [['友', 'とも']]],
  ['帰り道', 'カエリミチ', [['帰', 'かえ'], ['道', 'みち']]],
  ['取り扱い', 'トリアツカイ', [['取', 'と'], ['扱', 'あつか']]],
  ['お茶', 'オチャ', [['茶', 'ちゃ']]],
  ['𠮷野', 'ヨシノ', [['𠮷野', 'よしの']]],
  ['きょう', 'キョウ', []], ['コーヒー', 'コーヒー', []],
  ['未知', undefined, []], ['未知', '*', []], ['食べ', 'アバ', []],
]) {
  const characters = [...surface_form].map((text, index) => ({ text, index, start: index, end: index + 1 }));
  const sample = new NarrationModel(new AudioStub(), { text: surface_form, duration: characters.length + 1, characters, words: [], sentences: [] }, [], { tokenize: () => [{ surface_form, reading, pos: '名詞' }] });
  assert.deepEqual(sample.tokens[0].ruby.map(part => [part.text, part.reading]), expected);
  for (const part of sample.tokens[0].ruby) {
    assert.equal([...surface_form].slice(part.start, part.end).join(''), part.text);
    assert.ok(sample.glyphs.filter(g => g.index >= part.start && g.index < part.end).every(g => g.ruby === part));
  }
}
for (const story of [timeline, cafe, fixture]) {
  const colored = new NarrationModel(new AudioStub(), story, [], tokenizer);
  const plain = new NarrationModel(new AudioStub(), story);
  assert.deepEqual(colored.units.map(unit => unit.cue), plain.units.map(unit => unit.cue), 'Token coloring must preserve all reading-unit timing');
  assert.equal(colored.paragraphs.map(p => p.map(g => g.text).join('')).join('\n\n'), story.text);
  for (const token of colored.tokens) assert.equal([...story.text].slice(token.start, token.end).join(''), token.surface_form);
  assert.ok(colored.units.every(unit => unit.token), 'Every spoken unit must have a token');
  assert.ok(colored.partsOfSpeech.includes('名詞'));
  assert.ok(!colored.partsOfSpeech.includes('記号'));
  for (const unit of colored.units) {
    colored.seek((unit.cue.start + unit.cue.end) / 2);
    assert.equal(colored.state.word, unit.token.surface_form);
    assert.equal(colored.state.activePos, unit.token.pos);
    assert.ok(Math.abs(colored.state.activeFill - .5) < 1e-9);
  }
}
const colored = new NarrationModel(new AudioStub(), timeline, stories, tokenizer);
assert.equal(colored.tokens.find(token => token.surface_form === '学校').pos, '名詞');
assert.equal(colored.tokens.find(token => token.surface_form === '行き').pos, '動詞');
assert.equal(colored.tokens.find(token => token.surface_form === 'へ').pos, '助詞');
assert.equal(colored.tokens.find(token => token.surface_form === '学校').ruby[0].reading, 'がっこう');
assert.deepEqual(colored.tokens.find(token => token.surface_form === '小さい').ruby.map(part => [part.text, part.reading]), [['小', 'ちい']]);
const unicodeText = '𠮷野、猫。\n\n猫はコーヒー。';
const unicodeCharacters = [...unicodeText].flatMap((text, index) => /[\p{L}\p{N}]/u.test(text) ? [{ text, index, start: index / 5, end: (index + 1) / 5 }] : []);
const unicode = new NarrationModel(new AudioStub(), { text: unicodeText, duration: 10, characters: unicodeCharacters, words: [], sentences: [] }, [], tokenizer);
for (const token of unicode.tokens) assert.equal([...unicodeText].slice(token.start, token.end).join(''), token.surface_form, 'Supplementary Unicode and repeated words must keep original offsets');
assert.ok(unicode.units.every(unit => unit.token));
globalThis.fetch = async () => ({ ok: true, json: async () => cafe });
await colored.selectStory('cafe');
assert.ok(colored.tokens.some(token => token.surface_form === 'コーヒー'), 'Switching stories must rebuild tokens');
assert.ok(!colored.tokens.some(token => token.surface_form === '猫'));
assert.equal(colored.tokens.find(token => token.surface_form === '喫茶店').ruby[0].reading, 'きっさてん', 'Switching stories must rebuild hiragana annotations');
assert.throws(() => new NarrationModel(new AudioStub(), timeline, [], { tokenize: () => [{ surface_form: '猫', pos: '名詞' }] }), /Invalid token alignment/);
console.log('Passed: fill, punctuation, kana timing, story switching, stale requests, playback failures, Kuromoji offsets, POS and hiragana ruby.');
