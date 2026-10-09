/*
 * Balloon Pop haptics for the web prototype.
 *   - iOS 18+ Safari: no navigator.vibrate, but toggling an <input type="checkbox" switch> through its
 *     <label> inside a user gesture plays the system "switch" tick. One tick per call; a double tick is
 *     two toggles ~70 ms apart (the second one may be dropped if WebKit no longer counts it as a gesture).
 *   - Android / others: navigator.vibrate patterns.
 * The native app should map these names to UIImpactFeedbackGenerator / UINotificationFeedbackGenerator
 * (light/medium/rigid impacts, success/warning/error) for real intensity control.
 */
(function () {
  'use strict';
  const ua = navigator.userAgent || '';
  const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canVibrate = typeof navigator.vibrate === 'function' && !isIOS;
  let enabled = true, label = null;
  function ensureSwitch() {
    if (label || !isIOS) return label;
    label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    return label;
  }
  function tick() { const l = ensureSwitch(); if (l) l.click(); }
  // name -> [iOS tick count, vibrate pattern]
  const PATTERNS = { pop:[1,10], gold:[2,[16,40,20]], bad:[2,[40,60,40]], miss:[1,24], over:[3,[30,60,30,60,60]], click:[1,6] };
  function fire(name) {
    if (!enabled) return;
    const p = PATTERNS[name]; if (!p) return;
    try {
      if (isIOS) { tick(); for (let k = 1; k < p[0]; k++) setTimeout(tick, 70 * k); }
      else if (canVibrate) navigator.vibrate(p[1]);
    } catch (e) { /* ignore */ }
  }
  window.Haptics = { fire, set(on) { enabled = !!on; }, get supported() { return isIOS || canVibrate; }, isIOS };
})();
