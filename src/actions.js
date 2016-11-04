/**
 * Created by pfbongio on 02/11/2016.
 */
'use strict'

import {RETRIEVE_FETCH_APP_TOKEN, FETCH_WITH_APP_TOKEN} from './consts'

/**
 * Action that starts initializing a number of scopes for later use
 * in fetch requests.
 *
 *
 * @param scopes array of scopes to retrieve the token for
 * @param cb callback called with the token data after succesfully retrieving it
 * @returns {{type, scopes: *}}
 */
export function retrieveFetchAppToken (scopes, cb) {
    return {
        type: RETRIEVE_FETCH_APP_TOKEN,
        scopes,
        cb
    }
}

export function fetchWithAppToken (url, fetchOptions, scope, afterFetchAction) {
    return {
        type: FETCH_WITH_APP_TOKEN,
        url,
        scope,
        fetchOptions,
        afterFetchAction
    }
}
