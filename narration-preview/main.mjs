import { NarrationModel } from './model.mjs';

const node = (name) => document.querySelector(`[data-n="${name}"]`);
const clock = (time) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${(time % 60).toFixed(2).padStart(5, '0')}`;

class NarrationView {
  constructor(model, labels) {
    this.model = model;
    this.labels = labels;
    for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = labels[element.dataset.i18n];
    document.title = `VoiceStudio · ${labels.preview}`;
    node('language-label').textContent = new Intl.DisplayNames('ja', { type: 'language' }).of('ja');
    node('seek-slider').setAttribute('aria-label', labels.seek);
    node('story-switcher').setAttribute('aria-label', labels.script);
    this.renderedTimeline = null;
    this.glyphNodes = [];
    for (const story of model.stories) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.n = 'story-button';
      button.dataset.story = story.id;
      button.textContent = story.title;
      button.lang = 'ja';
      button.addEventListener('click', () => model.selectStory(story.id));
      node('story-switcher').append(button);
    }
    node('play-button').addEventListener('click', () => model.toggle());
    node('reset-button').addEventListener('click', () => model.seek(0));
    node('seek-slider').addEventListener('input', (event) => model.seek(Number(event.target.value)));
    for (const button of document.querySelectorAll('[data-rate]')) button.addEventListener('click', () => model.setRate(Number(button.dataset.rate)));
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); model.toggle(); }
    });
    model.addEventListener('change', () => this.render(model.state));
    this.render(model.state);
  }
  renderScript() {
    const { model, labels } = this;
    node('narration-title').textContent = model.story?.title || model.timeline.sentences[0].text;
    node('seek-slider').max = model.timeline.duration;
    node('timeline-duration').textContent = clock(model.timeline.duration);
    node('transcript').replaceChildren();
    node('pos-legend').replaceChildren();
    for (const pos of model.partsOfSpeech) {
      const label = document.createElement('span');
      label.dataset.n = 'pos-legend-item';
      label.dataset.pos = pos;
      label.textContent = pos;
      node('pos-legend').append(label);
    }
    this.glyphNodes = [];
    for (const paragraph of model.paragraphs) {
      const p = document.createElement('p');
      p.dataset.n = 'transcript-paragraph';
      let rubyBase = null;
      for (const { text, cue, index, kind, token, ruby } of paragraph) {
        const spoken = kind === 'speech';
        const element = document.createElement(spoken ? 'button' : 'span');
        element.dataset.n = spoken ? 'spoken-character' : kind === 'punctuation' ? 'transcript-punctuation' : 'transcript-spacing';
        element.dataset.index = index;
        element.textContent = text;
        if (token) {
          element.dataset.pos = token.pos;
          element.title = [token.surface_form, token.pos, token.reading].filter(value => value && value !== '*').join(' · ');
        }
        if (spoken) {
          element.type = 'button';
          element.dataset.estimated = String(cue.estimated);
          element.setAttribute('aria-label', `${labels.seek} ${text} ${clock(cue.start)}`);
          element.addEventListener('click', () => model.seekCharacter(cue.index));
        }
        if (ruby && index === ruby.start) {
          const annotation = document.createElement('ruby');
          annotation.dataset.n = 'kanji-annotation';
          annotation.dataset.pos = token.pos;
          rubyBase = document.createElement('span');
          rubyBase.dataset.n = 'kanji-base';
          const reading = document.createElement('rt');
          reading.dataset.n = 'hiragana-reading';
          reading.textContent = ruby.reading;
          annotation.append(rubyBase, reading);
          p.append(annotation);
        }
        (ruby ? rubyBase : p).append(element);
        this.glyphNodes.push(element);
      }
      node('transcript').append(p);
    }
    if (model.story) {
      node('download-wav').href = model.story.audio;
      node('download-wav').download = model.timeline.audio;
      node('download-subtitles').href = model.story.subtitle;
      node('download-subtitles').download = model.timeline.audio.replace(/\.wav$/, '.srt');
      node('download-timeline').href = model.story.timeline;
      node('download-timeline').download = model.timeline.audio.replace(/\.wav$/, '.timeline.json');
    }
    this.renderedTimeline = model.timeline;
  }
  render(state) {
    const { model, labels } = this;
    if (this.renderedTimeline !== state.timeline) this.renderScript();
    node('script-panel').setAttribute('aria-busy', String(state.loading));
    node('downloads').hidden = state.loading || state.error;
    for (const button of document.querySelectorAll('[data-story]')) button.setAttribute('aria-pressed', String(button.dataset.story === state.story?.id));
    node('play-button').disabled = !state.ready;
    node('play-button').setAttribute('aria-label', state.paused ? labels.play : labels.pause);
    node('play-button').setAttribute('aria-pressed', String(!state.paused));
    node('play-label').textContent = state.loading ? labels.loading : state.paused ? labels.play : labels.pause;
    node('play-icon').textContent = state.paused ? '▶' : 'Ⅱ';
    node('elapsed-time').textContent = clock(state.time);
    node('seek-slider').value = state.time;
    node('seek-slider').setAttribute('aria-valuetext', `${clock(state.time)} / ${clock(state.duration)}`);
    node('playback-status').textContent = state.paused ? labels.paused : labels.nowPlaying;
    node('current-character').textContent = state.activeText;
    node('current-character').dataset.pos = state.activePos;
    node('current-character').style.setProperty('--fill', `${state.activeFill * 100}%`);
    node('current-word').textContent = state.word || '—';
    node('character-counter').textContent = `${state.active < 0 ? '—' : state.active + 1} / ${state.unitCount}`;
    node('character-time').textContent = clock(state.time);
    node('sound-bars').dataset.playing = String(!state.paused);
    node('playback-error').hidden = !state.error;
    node('playback-error').textContent = state.error ? labels.unavailable : '';
    for (const [index, element] of this.glyphNodes.entries()) {
      const glyph = state.glyphs[index];
      element.style.setProperty('--fill', `${glyph.fill * 100}%`);
      element.dataset.state = glyph.state;
      if (glyph.state === 'active') element.setAttribute('aria-current', 'true');
      else element.removeAttribute('aria-current');
    }
    for (const button of document.querySelectorAll('[data-rate]')) button.setAttribute('aria-pressed', String(Number(button.dataset.rate) === state.rate));
  }
}

try {
  const [stories, labels, tokenizer] = await Promise.all([...['./stories.json', './locales/zh-CN.json'].map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Preview data unavailable');
    return response.json();
  }), NarrationModel.loadTokenizer()]);
  const response = await fetch(stories[0].timeline);
  if (!response.ok) throw new Error('Preview data unavailable');
  const model = new NarrationModel(node('narration-audio'), await response.json(), stories, tokenizer);
  new NarrationView(model, labels);
} catch (error) {
  node('playback-error').hidden = false;
  node('playback-error').textContent = node('playback-error').dataset.message;
  console.error(error);
}
