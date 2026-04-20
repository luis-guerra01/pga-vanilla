import {
    buildSearchStatus,
    buildUrlManager,
} from 'https://static.cloud.coveo.com/headless/v3/headless.esm.js';

export const getSearchParam = () => {
    const params     = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    if (params.get('criteria'))     return { value: params.get('criteria'),     from: 'criteria' };
    if (hashParams.get('criteria')) return { value: hashParams.get('criteria'), from: 'criteria' };
    if (params.get('q'))            return { value: params.get('q'),            from: 'q' };
    if (hashParams.get('q'))        return { value: hashParams.get('q'),        from: 'q' };

    return { value: '', from: '' };
};

export const bindUrlManager = (engine) => {
    const statusControllers = buildSearchStatus(engine);

    const fragment = () => {
        let frag = window.location.hash.slice(1) || window.location.search.slice(1);
        if (!frag) return '';

        const params = new URLSearchParams(frag);

        if (params.get('criteria') && !params.get('q')) {
            let qValue = params.get('criteria');
            qValue = decodeURIComponent(qValue.replace(/\+/g, ' '));
            params.delete('criteria');
            params.set('q', qValue);
        }

        let fragmentStr = '';
        for (const [key, value] of params.entries()) {
            if (key === 'q') {
                fragmentStr += `${key}=${value}&`;
            } else {
                fragmentStr += `${key}=${encodeURIComponent(value)}&`;
            }
        }

        return fragmentStr.slice(0, -1); // remove trailing &
    };

    const urlManager = buildUrlManager(engine, {
        initialState: { fragment: fragment() },
    });

    let lastQ = getSearchParam().value;

    const triggerGeneratedAnswer = (param) => {
        const value = param.value;
        if (!value) return;

        if (engine && engine._searchBoxController) {
            engine._searchBoxController.updateText(value);
            engine._searchBoxController.submit();
        }

        if (engine && engine._rgaController && engine._rgaController.refresh) {
            engine._rgaController.refresh();
        }
    };

    // Listen for hash changes (legacy support)
    const onHashChange = () => {
        urlManager.synchronize(fragment());
        const current = getSearchParam();
        if (current.value !== lastQ) {
            lastQ = current.value;
            triggerGeneratedAnswer(current);
        }
    };
    window.addEventListener('hashchange', onHashChange);

    // Listen for popstate (query string changes via history API)
    const onPopState = () => {
        const current = getSearchParam();
        if (current.value !== lastQ) {
            lastQ = current.value;
            triggerGeneratedAnswer(current);
        }
    };
    window.addEventListener('popstate', onPopState);

    const unsubscribeManager = urlManager.subscribe(() => {
        const hash = `${urlManager.state.fragment}`;
        if (!statusControllers.state.firstSearchExecuted) {
            history.replaceState(null, document.title, hash);
            return;
        }
        history.pushState(null, document.title, hash);
    });

    return () => {
        window.removeEventListener('hashchange', onHashChange);
        window.removeEventListener('popstate',   onPopState);
        unsubscribeManager();
    };
};
