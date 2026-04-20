/**
 * coveo-search-controller.js
 * Vanilla JS equivalent of the React custom hook `use-coveo-search.js`
 *
 * Replaces React's useState / useEffect / useMemo with:
 *   - A single async init function
 *   - Callback props for state changes  (onRGAStateChange, onResultsStateChange)
 *   - A returned destroy() for cleanup  (mirrors useEffect return)
 *
 * Usage:
 *   import { initCoveoSearch } from './coveo-search-controller.js';
 *
 *   const { controllers, destroy } = await initCoveoSearch({
 *     query: 'my query',
 *     onRGAStateChange:     (state)   => renderRGA(state),
 *     onResultsStateChange: (results) => renderResults(results),
 *   });
 */

import {
    buildContext,
    buildGeneratedAnswer,
    buildResultList,
    buildSearchBox,
} from 'https://static.cloud.coveo.com/headless/v3/headless.esm.js';

import { getCoveoEngine }     from './get-coveo-engine.js';
import { bindUrlManager }     from './bind-url-manager.js';
import { bindExecuteTrigger } from './bind-execute-trigger.js';
import { DEFAULT_CITATION_FIELDS } from './constants.js';

/**
 * Initialises the Coveo engine + all controllers, wires subscriptions,
 * and fires the first search.
 *
 * @param {Object}   options
 * @param {string}   [options.query='']              Initial query (usually read from URL)
 * @param {Function} [options.onRGAStateChange]      Fired on every Generated Answer state update
 * @param {Function} [options.onResultsStateChange]  Fired on every result list state update
 * @param {Function} [options.onEngineReady]         Fired once, right before the first search
 *
 * @returns {Promise<{ controllers: Object, destroy: Function }>}
 */
export async function initCoveoSearch({
    query                = '',
    onRGAStateChange     = () => {},
    onResultsStateChange = () => {},
    onEngineReady        = () => {},
} = {}) {

    // ── 1. Build engine ──────────────────────────────────────────────────────
    // Mirrors: getCoveoEngine inside the first useEffect
    const engine = await getCoveoEngine({ query });

    // ── 2. Build controllers ─────────────────────────────────────────────────
    // Mirrors: the useMemo block
    const searchBoxController  = buildSearchBox(engine);
    const contextController    = buildContext(engine);
    const resultListController = buildResultList(engine, {
        /*
        options: {
            fieldsToInclude: [], // add any custom field names here
        }
        */
    });

    const RGAController = buildGeneratedAnswer(engine, {
        // answerConfigurationId: 'YOUR_CONFIG_ID',
        fieldsToIncludeInCitations: DEFAULT_CITATION_FIELDS,
        initialState: {
            isVisible: true,
            responseFormat: {
                contentFormat: ['text/markdown'],
            },
        },
    });

    // Attach to engine so bind-url-manager can reach them
    // Mirrors: engine._searchBoxController and engine._rgaController in the hook
    engine._searchBoxController = searchBoxController;
    engine._rgaController       = RGAController;

    const controllers = {
        searchBoxController,
        contextController,
        resultListController,
        RGAController,
    };

    // ── 3. Subscribe to state changes ────────────────────────────────────────
    // Mirrors: the useEffect that called setRgaState / setResultsState
    // Instead of React re-renders we call the callbacks — the UI updates the DOM.
    const unsubRGA = RGAController.subscribe(() => {
        onRGAStateChange(RGAController.state);
    });

    const unsubResults = resultListController.subscribe(() => {
        onResultsStateChange(resultListController.state.results);
    });

    // ── 4. Bind URL manager + execute trigger ────────────────────────────────
    // Mirrors: the second useEffect in the hook
    const unsubscribeUrlManager     = bindUrlManager(engine);
    const unsubscribeExecuteTrigger = bindExecuteTrigger(engine);

    // ── 5. Notify caller & execute first search ──────────────────────────────
    // Mirrors: executeInitialSearch() — must run AFTER bindUrlManager
    onEngineReady(controllers);

    if (engine.executeFirstSearch) {
        engine.executeFirstSearch();
    }

    // ── 6. Return a single destroy() ─────────────────────────────────────────
    // Mirrors: the cleanup functions returned from both useEffects
    function destroy() {
        unsubRGA();
        unsubResults();
        unsubscribeUrlManager();
        unsubscribeExecuteTrigger();
    }

    return { controllers, destroy };
}
