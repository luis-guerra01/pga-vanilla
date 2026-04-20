/**
 * feedback-modal.js
 * Vanilla JS equivalent of FeedbackModal React component.
 *
 * Usage:
 *   import { openFeedbackModal } from './feedback-modal.js';
 *
 *   openFeedbackModal({
 *     onSend: (formData) => handleSendFeedback(formData),
 *   });
 */

// ─── Internal state (mirrors useState in the React component) ─────────────────

const DEFAULT_FORM = () => ({
  rightTopic:  null,
  hallucinated: null,
  answerable:  null,
  readable:    null,
  link:        '',
  notes:       '',
});

// ─── DOM builder ──────────────────────────────────────────────────────────────

/**
 * Builds and returns the modal DOM node.
 * Mirrors the JSX returned by <FeedbackModal />.
 */
function buildModalDOM() {
  const QUESTIONS = [
    { label: 'Is the answer about the right topic?',              field: 'rightTopic'   },
    { label: 'Is the answer free of hallucinated content?',       field: 'hallucinated' },
    { label: 'Can the question be answered by the documentation?', field: 'answerable'  },
    { label: 'Is the answer readable?',                           field: 'readable'     },
  ];

  const OPTIONS = ['yes', 'unknown', 'no'];

  // Build question rows HTML
  const rowsHTML = QUESTIONS.map(({ label, field }) => `
    <div class="modal-row" data-field="${field}">
      <span class="modal-question">
        ${label} <span class="required">*</span>
      </span>
      <div class="modal-options">
        ${OPTIONS.map(opt => `
          <button class="option-btn" data-field="${field}" data-value="${opt}">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-container">

      <div class="modal-header">
        <h2 class="modal-title">Help us improve! Provide additional feedback</h2>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>

      <div class="modal-divider"></div>

      <div class="modal-body">
        <p class="modal-section-title">Answer evaluation</p>

        ${rowsHTML}

        <p class="modal-section-title" style="margin-top:1.5rem;">Link to correct answer</p>
        <input
          id="modal-link-input"
          type="text"
          class="modal-input"
          placeholder="https://URL"
        />

        <p class="modal-section-title" style="margin-top:1.25rem;">Additional notes</p>
        <textarea
          id="modal-notes-textarea"
          class="modal-textarea"
          placeholder="Add notes"
        ></textarea>
      </div>

      <div class="modal-footer">
        <span class="modal-required-note">
          <span class="required">*</span> Required fields
        </span>
        <div class="modal-footer-actions">
          <button class="btn-skip"  id="modal-skip-btn">Skip</button>
          <button class="btn-send"  id="modal-send-btn">Send feedback</button>
        </div>
      </div>

    </div>
  `;

  return overlay;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Opens the feedback modal and mounts it into <body>.
 * Mirrors: {showFeedbackModal && <FeedbackModal onClose={…} onSend={…} />}
 *
 * @param {Object}   options
 * @param {Function} options.onSend   Called with the formData object when "Send feedback" is clicked
 * @param {Function} [options.onClose] Optional callback fired when the modal closes for any reason
 */
export function openFeedbackModal({ onSend, onClose = () => {} }) {
  // Mirrors: useState for feedbackForm
  const formData = DEFAULT_FORM();

  const overlay = buildModalDOM();
  document.body.appendChild(overlay);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function close() {
    overlay.remove();
    onClose();
  }

  // Mirrors: handleOption — toggles selected state on option buttons
  function handleOption(field, value) {
    formData[field] = value;

    // Update button selected styles
    overlay.querySelectorAll(`.option-btn[data-field="${field}"]`).forEach(btn => {
      btn.classList.toggle('option-btn--selected', btn.dataset.value === value);
    });
  }

  // Mirrors: handleSend
  function handleSend() {
    formData.link  = overlay.querySelector('#modal-link-input').value;
    formData.notes = overlay.querySelector('#modal-notes-textarea').value;
    onSend(formData);
    close();
  }

  // ── Event listeners ────────────────────────────────────────────────────────

  // Close on overlay background click (mirrors: onClick={onClose} on .modal-overlay)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-skip-btn').addEventListener('click', close);
  overlay.querySelector('#modal-send-btn').addEventListener('click', handleSend);

  // Option buttons (mirrors: onClick={() => handleOption(field, opt)})
  overlay.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => handleOption(btn.dataset.field, btn.dataset.value));
  });
}