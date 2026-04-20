/**
 * coveo-app.js
 * Vanilla JS equivalent of App.jsx — no React, no bundler, no build step.
 *
 * HOW TO USE IN SITECORE
 * ──────────────────────
 * 1. Upload ALL JS files + the CSS to your Sitecore static assets folder.
 * 2. Link the stylesheet in <head>:
 *      <link rel="stylesheet" href="/path/to/coveo-rga.css" />
 * 3. Add the host element where you want the widget:
 *      <div id="coveo-rga-widget"></div>
 * 4. Load this file at the bottom of <body>:
 *      <script type="module" src="/path/to/coveo-app.js"></script>
 */

import { initCoveoSearch }     from './coveo-search-controller.js';
import { getSearchParam }      from './bind-url-manager.js';
import { parseMarkdownToHTML } from './utils.js';
import { openFeedbackModal }   from './feedback-modal.js';

// ─── SVG icons (inlined — mirrors JSX SVGs in App.jsx) ───────────────────────

const ICON_THUMB = `
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="m 11.00003,8.49978 h 0.5 c 0.55229,0 1,0.44771 1,1 v 0 c 0,0.55228 -0.44771,1 -1,1 L 10,10.49996 h 1 c 0.55228,0 0.99999,0.44771 1,1 v 0 c 0,0.55228 -0.44772,1 -1,1 H 9.5 l -3.52786,-6e-5 c -0.31049,0 -0.61672,-0.07229 -0.89443,-0.21115 L 3.5,11.4999 m 0,-6.5 c 0,-0.2761 -0.2239,-0.5 -0.5,-0.5 H 1 c -0.2761,0 -0.5,0.2239 -0.5,0.5 v 7 c 0,0.27614 0.2239,0.5 0.5,0.5 h 2 c 0.2761,0 0.5,-0.22386 0.5,-0.5 v -0.5 -6.5 h 0.9415 c 0.3471,10e-6 0.6694,-0.18 0.85145,-0.4755 L 6.48493,2.5895 C 6.49482,2.5735 6.50005,2.555 6.50005,2.5361 L 6.50004,1.477 C 6.50004,0.9374 6.93748,0.5 7.47709,0.5 v 0 c 0.32669,0 0.63296,0.165 0.81417,0.4368 v 0 C 8.7432,1.6147 8.91025,2.4487 8.75047,3.2476 L 8.5000098,4.498621 12.5,4.497321 c 0,0 1,-0.07687 1,0.9999998 0,0.983123 -1,1-1,1 l -2.460584,0.00258 h 2 c 0.55228,0 1,0.44772 1,1 v 0 c 0,0.55228 -0.44772,1 -1,1 h -2"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_COPY = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.50024" width="9" height="10" rx="1.5" stroke="currentColor"/>
    <path d="M3.5 8.50024H8.5"              stroke="currentColor" stroke-linecap="round"/>
    <path d="M3.5 4.50024L8.5 4.50024"      stroke="currentColor" stroke-linecap="round"/>
    <path d="M3.5 6.50024L8.5 6.50024"      stroke="currentColor" stroke-linecap="round"/>
    <path d="M4.5 14.5002L11.5 14.5002C12.6046 14.5002 13.5 13.6048 13.5 12.5002L13.5 5.50024"
      stroke="currentColor" stroke-linecap="round"/>
  </svg>`;

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getQueryFromUrl() {
  const params     = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  return (
    params.get('q')            ||
    hashParams.get('q')        ||
    params.get('criteria')     ||
    hashParams.get('criteria') ||
    ''
  );
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

/**
 * Injects the widget HTML into `host` and returns refs to key elements.
 * Mirrors the JSX returned by App() — same structure, plain DOM.
 */
function buildDOM(host) {
  host.innerHTML = `
    <div class="coveo-rga-wrapper" style="margin:2rem auto;font-family:sans-serif;">

      <!-- Hidden search form (parity with App.jsx) -->
      <form id="coveo-rga-form" style="display:none;">
        <input  id="coveo-rga-input"  type="text" />
        <button id="coveo-rga-submit" type="submit">Search</button>
      </form>

      <!-- Loading indicator -->
      <div id="coveo-rga-loading">loading engine …</div>

      <!-- RGA card — hidden until there is an answer -->
      <div id="coveo-rga-card" class="coveo-rga-card" style="display:none;">

        <div class="rga-header">
          <span class="rga-icon">✨ Generated answer</span>
          <div class="rga-toggle"></div>
        </div>

        <!-- Answer content (markdown rendered as HTML) -->
        <div id="coveo-rga-content" class="rga-content"></div>

        <!-- Citations -->
        <div id="coveo-rga-citations" class="rga-citations-section" style="display:none;">
          <h4>Citations</h4>
          <div id="coveo-rga-citations-grid" class="rga-citations-grid"></div>
        </div>

        <!-- Footer: actions + disclaimer -->
        <div class="rga-footer">
          <div class="rga-actions-left">
            <button id="coveo-btn-like"    class="action-btn" title="Like">${ICON_THUMB}</button>
            <button id="coveo-btn-dislike" class="action-btn rotate-180" title="Dislike">${ICON_THUMB}</button>
            <button id="coveo-btn-copy"    class="action-btn" title="Copy">${ICON_COPY}</button>
          </div>
          <span class="rga-disclaimer">
            Generated content may contain errors. Verify important information.
          </span>
        </div>

      </div>
    </div>
  `;

  return {
    loading:       host.querySelector('#coveo-rga-loading'),
    card:          host.querySelector('#coveo-rga-card'),
    content:       host.querySelector('#coveo-rga-content'),
    citationsWrap: host.querySelector('#coveo-rga-citations'),
    citationsGrid: host.querySelector('#coveo-rga-citations-grid'),
    btnLike:       host.querySelector('#coveo-btn-like'),
    btnDislike:    host.querySelector('#coveo-btn-dislike'),
    btnCopy:       host.querySelector('#coveo-btn-copy'),
    form:          host.querySelector('#coveo-rga-form'),
    input:         host.querySelector('#coveo-rga-input'),
  };
}

// ─── Render ───────────────────────────────────────────────────────────────────

/**
 * Re-renders the RGA card whenever RGAController state changes.
 * Mirrors: {rgaState?.answer && (<div className="coveo-rga-card">…</div>)}
 */
function renderRGA(rgaState, els) {
  if (!rgaState?.answer) {
    els.card.style.display = 'none';
    return;
  }

  // Show card and render markdown → HTML
  // Mirrors: <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(rgaState.answer) }} />
  els.card.style.display = 'block';
  els.content.innerHTML  = parseMarkdownToHTML(rgaState.answer);

  // Citations — mirrors: {rgaState.citations?.length > 0 && (…)}
  if (rgaState.citations?.length > 0) {
    els.citationsGrid.innerHTML = rgaState.citations
      .map((c) => `
        <a href="${c.clickUri}" target="_blank" class="citation-pill">
          ${c.title}
        </a>
      `)
      .join('');
    els.citationsWrap.style.display = 'block';
  } else {
    els.citationsWrap.style.display = 'none';
  }
}

// ─── Action handlers ──────────────────────────────────────────────────────────

/**
 * Wires up like, dislike and copy buttons + feedback modal.
 * Mirrors: handleLike / handleDislike / handleCopy in App.jsx.
 */
function bindActionButtons(els, controllers) {
  // Mirrors: useState(null) for feedback
  let feedback = null;

  // ── Like ──────────────────────────────────────────────────────────────────
  // Mirrors: handleLike()
  els.btnLike.addEventListener('click', () => {
    feedback = 'like';
    els.btnLike.classList.add('active-like');
    els.btnDislike.classList.remove('active-dislike');

    const state = controllers.RGAController.state;
    controllers.RGAController.like(state?.responseId);

    // Mirrors: setShowFeedbackModal(true)
    openFeedbackModal({
      onSend: (formData) => handleSendFeedback(formData, feedback, controllers),
    });
  });

  // ── Dislike ───────────────────────────────────────────────────────────────
  // Mirrors: handleDislike()
  els.btnDislike.addEventListener('click', () => {
    feedback = 'dislike';
    els.btnDislike.classList.add('active-dislike');
    els.btnLike.classList.remove('active-like');

    const state = controllers.RGAController.state;
    controllers.RGAController.dislike(state?.responseId);

    openFeedbackModal({
      onSend: (formData) => handleSendFeedback(formData, feedback, controllers),
    });
  });

  // ── Copy ──────────────────────────────────────────────────────────────────
  // Mirrors: handleCopy()
  els.btnCopy.addEventListener('click', () => {
    const answer = controllers.RGAController.state?.answer;
    if (!answer) return;

    navigator.clipboard.writeText(answer).then(() => {
      const state = controllers.RGAController.state;
      controllers.RGAController.logCopyToClipboard(state?.responseId);

      // Mirrors: setCopied(true) + setTimeout(() => setCopied(false), 2000)
      els.btnCopy.classList.add('active-copy');
      setTimeout(() => els.btnCopy.classList.remove('active-copy'), 2000);
    });
  });
}

/**
 * Sends the structured feedback payload to Coveo.
 * Mirrors: handleSendFeedback() in App.jsx.
 */
async function handleSendFeedback(formData, feedback, controllers) {
  await controllers.RGAController.openFeedbackModal();
  await controllers.RGAController.sendFeedback({
    helpful:           feedback === 'like',
    correctTopic:      formData.rightTopic,
    details:           formData.notes,
    documented:        formData.answerable,
    documentUrl:       formData.link,
    hallucinationFree: formData.hallucinated,
    readable:          formData.readable,
  });
  await controllers.RGAController.closeFeedbackModal();
}

// ─── handleSearch ─────────────────────────────────────────────────────────────

function handleSearch({ controllers, query }) {
  const path = window.location.pathname;
  window.history.pushState(
    {},
    '',
    query ? `${path}?q=${encodeURIComponent(query)}` : path
  );
  if (controllers) {
    controllers.searchBoxController.updateText(query);
    controllers.searchBoxController.submit();
  }
}

// ─── URL-change listener ──────────────────────────────────────────────────────

function bindUrlChangeListener(controllers) {
  let lastQ = getQueryFromUrl();

  const onUrlChange = () => {
    const newQ = getQueryFromUrl();
    if (newQ !== lastQ) {
      lastQ = newQ;
      handleSearch({ controllers, query: newQ });
    }
  };

  window.addEventListener('popstate',   onUrlChange);
  window.addEventListener('hashchange', onUrlChange);

  return () => {
    window.removeEventListener('popstate',   onUrlChange);
    window.removeEventListener('hashchange', onUrlChange);
  };
}

// ─── Main mount ───────────────────────────────────────────────────────────────

/**
 * Mounts the full Coveo RGA widget inside `host`.
 * Mirrors: the App() component lifecycle — init → render → cleanup.
 */
export async function mountCoveoWidget(host) {
  const els   = buildDOM(host);
  const query = getQueryFromUrl();

  // Show loading — mirrors: if (!controllers) return <div>loading…</div>
  els.loading.style.display = 'block';

  let destroySearch      = () => {};
  let destroyUrlListener = () => {};

  try {
    const { controllers, destroy } = await initCoveoSearch({
      query,

      onRGAStateChange:     (state)   => renderRGA(state, els),
      onResultsStateChange: (results) => console.debug('[coveo-app] results:', results),

      onEngineReady: (ctrls) => {
        els.loading.style.display = 'none';

        // Wire like / dislike / copy / feedback modal
        bindActionButtons(els, ctrls);

        // URL-change listener
        destroyUrlListener = bindUrlChangeListener(ctrls);

        // Hidden form
        els.form.addEventListener('submit', (e) => {
          e.preventDefault();
          handleSearch({ controllers: ctrls, query: els.input.value });
        });
      },
    });

    destroySearch = destroy;

  } catch (err) {
    console.error('[coveo-app] Failed to initialise Coveo engine:', err);
    els.loading.textContent = 'Failed to load search engine.';
  }

  return function unmount() {
    destroySearch();
    destroyUrlListener();
    host.innerHTML = '';
  };
}

// ─── Auto-mount ───────────────────────────────────────────────────────────────

(function autoMount() {
  const init = async () => {
    const host = document.getElementById('coveo-rga-widget');
    if (!host) return;
    const unmount = await mountCoveoWidget(host);
    window.addEventListener('beforeunload', unmount, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();