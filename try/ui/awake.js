/* ☀️ Keep the screen on: stops the phone / iPad from dimming to the lock screen while the GlowBop console is open.
   Uses the browser's Screen Wake Lock when it's allowed (needs https), otherwise the trick video players use:
   a tiny silent, muted video looping out of sight. Starts on the first tap (browsers require a tap), on by default,
   switch in Setup → Screen. */
(function () {
  'use strict';
  const VID = 'data:video/mp4;base64,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b21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0xIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAADmWIhAW///8PRQABT3+AARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAcAAAAGQZo4CvqAARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAc=';
  const WEBM = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAeFEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggGETbuMU6uEHFO7a1Osggdv7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiECfYAAAAAAAFlSua0CmrgEAAAAAAAA414EBc8WIYG6WfaDfwO6cgQAitZyDdW5kiIEAhoVWX1ZQOIOBASPjg4Q7msoA4ImwgRC6gRCagQKuAQAAAAAAAFzXgQJzxYjaiNexKefOyZyBACK1nIN1bmSIgQCGhkFfT1BVU1aqg2MuoFa7hATEtACDgQLhkZ+BAbWIQL9AAAAAAABiZIEQY6KTT3B1c0hlYWQBATgBQB8AAAAAABJUw2dA1nNzoGPAgGfImkWjh0VOQ09ERVJEh41MYXZmNjAuMTYuMTAwc3PWY8CLY8WIYG6WfaDfwO5nyKFFo4dFTkNPREVSRIeUTGF2YzYwLjMxLjEwMiBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAyLjAwMDAwMDAwMABzc9djwItjxYjaiNexKefOyWfIokWjh0VOQ09ERVJEh5VMYXZjNjAuMzEuMTAyIGxpYm9wdXNnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAyLjAwODAwMDAwMAAfQ7Z1RQnngQCji4IAAIAIC+Y7I6tgo6OBAACAEAIAnQEqEAAQAABHCIWFiJmEiAICAAwNYAD+/6tQgKOKggAVgAgIrLMOxqOKggApgAgIrLMOxqOKggA9gAgIrLMOxqOKggBRgAgIrLMOxqOKggBlgAgIrLMOxqOKggB5gAgIrLMOxqOKggCNgAgIrLMOxqOKggChgAgIrLMOxqOKggC1gAgIrLMOxqOKggDJgAgIrLMOxqOKggDdgAgIrLMOxqOKggDxgAgIrLMOxqOKggEFgAgIrLMOxqOKggEZgAgIrLMOxqOKggEtgAgIrLMOxqOKggFBgAgIrLMOxqOKggFVgAgIrLMOxqOKggFpgAgIrLMOxqOKggF9gAgIrLMOxqOKggGRgAgIrLMOxqOKggGlgAgIrLMOxqOKggG5gAgIrLMOxqOKggHNgAgIrLMOxqOKggHhgAgIrLMOxqOKggH1gAgIrLMOxqOKggIJgAgIrLMOxqOKggIdgAgIrLMOxqOKggIxgAgIrLMOxqOKggJFgAgIrLMOxqOKggJZgAgIrLMOxqOKggJtgAgIrLMOxqOKggKBgAgIrLMOxqOKggKVgAgIrLMOxqOKggKpgAgIrLMOxqOKggK9gAgIrLMOxqOKggLRgAgIrLMOxqOKggLlgAgIrLMOxqOKggL5gAgIrLMOxqOKggMNgAgIrLMOxqOKggMhgAgIrLMOxqOKggM1gAgIrLMOxqOKggNJgAgIrLMOxqOKggNdgAgIrLMOxqOKggNxgAgIrLMOxqOKggOFgAgIrLMOxqOKggOZgAgIrLMOxqOKggOtgAgIrLMOxqOKggPBgAgIrLMOxqOKggPVgAgIrLMOxqOKggPpgAgIrLMOxqOZgQPoALEBAAEQEAAYADA/9AwAAAD+/6tQgKOKggP9gAgIrLMOxqOKggQRgAgIrLMOxqOKggQlgAgIrLMOxqOKggQ5gAgIrLMOxqOKggRNgAgIrLMOxqOKggRhgAgIrLMOxqOKggR1gAgIrLMOxqOKggSJgAgIrLMOxqOKggSdgAgIrLMOxqOKggSxgAgIrLMOxqOKggTFgAgIrLMOxqOKggTZgAgIrLMOxqOKggTtgAgIrLMOxqOKggUBgAgIrLMOxqOKggUVgAgIrLMOxqOKggUpgAgIrLMOxqOKggU9gAgIrLMOxqOKggVRgAgIrLMOxqOKggVlgAgIrLMOxqOKggV5gAgIrLMOxqOKggWNgAgIrLMOxqOKggWhgAgIrLMOxqOKggW1gAgIrLMOxqOKggXJgAgIrLMOxqOKggXdgAgIrLMOxqOKggXxgAgIrLMOxqOKggYFgAgIrLMOxqOKggYZgAgIrLMOxqOKggYtgAgIrLMOxqOKggZBgAgIrLMOxqOKggZVgAgIrLMOxqOKggZpgAgIrLMOxqOKggZ9gAgIrLMOxqOKggaRgAgIrLMOxqOKggalgAgIrLMOxqOKgga5gAgIrLMOxqOKggbNgAgIrLMOxqOKggbhgAgIrLMOxqOKggb1gAgIrLMOxqOKggcJgAgIrLMOxqOKggcdgAgIrLMOxqOKggcxgAgIrLMOxqOKggdFgAgIrLMOxqOKggdZgAgIrLMOxqOKggdtgAgIrLMOxqOKggeBgAgIrLMOxqOKggeVgAgIrLMOxqOKggepgAgIrLMOxqOKgge9gAgIrLMOxqCToYqCB9EACAissw7GdaKEAM3+YBxTu2uRu4+zgQC3iveBAfGCAmDwgRA=';
  let on = GB.store.get('gb_awake', '1') === '1', lock = null, vid = null, armed = false;

  async function engage() {
    if (!on || document.hidden) return;
    if ('wakeLock' in navigator && window.isSecureContext) {
      try { if (!lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } return; } catch (e) {}
    }
    if (!vid) {
      vid = document.createElement('video'); vid.id = 'gbAwake';
      vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', ''); vid.setAttribute('aria-hidden', 'true');
      vid.muted = true; vid.loop = true;
      vid.src = vid.canPlayType('video/mp4; codecs="avc1.42E01E"') ? VID : WEBM;          // Safari: mp4, other browsers: webm
      vid.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
      document.body.appendChild(vid);
    }
    try { await vid.play(); } catch (e) {}
  }
  function release() {
    try { lock && lock.release(); } catch (e) {} lock = null;
    try { vid && vid.pause(); } catch (e) {}
  }
  function arm() { armed = true; engage(); }
  ['touchend', 'click'].forEach(ev => document.addEventListener(ev, arm, {passive: true}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && armed) engage(); });

  GB.awake = v => { on = v; GB.store.set('gb_awake', v ? '1' : '0'); v ? engage() : release(); paint(); };
  function paint() {
    const b = document.getElementById('awBtn'); if (!b) return;
    b.classList.toggle('on', on); b.textContent = on ? '☀️ Screen stays on' : '🌙 Screen can sleep';
  }
  GB.panel('setup', 55, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>Screen</span><span class="r">this phone / tablet</span></div>
      <button class="btn c wide" id="awBtn" style="--c:var(--gold)"></button>
      <p class="note">Keeps this screen from going to the lock screen while GlowBop is open, like a video app. Turn it off to save battery.</p>`;
    el.querySelector('#awBtn').onclick = () => { GB.awake(!on); GB.toast(on ? '☀️ The screen will stay on' : '🌙 The screen can sleep again'); };
    paint();
  });
})();
