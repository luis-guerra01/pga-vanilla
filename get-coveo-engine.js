import {
    buildSearchEngine,
    getSampleSearchEngineConfiguration,
} from 'https://static.cloud.coveo.com/headless/v3/headless.esm.js';

export const getCoveoEngine = async ({ query }) => {
    return buildSearchEngine({
        configuration: { 
            accessToken: 'xx5520f93d-1740-4612-8eac-5ae6d35af73c', 
            organizationId: 'stlukesuniversityhealthnetworknonproduction16nlbgydz', 
            environment: 'hipaa', 
            search: { 
                searchHub: 'sluhn_global_search', 
            }, 
        },
    })
};
