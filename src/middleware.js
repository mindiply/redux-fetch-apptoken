/**
 * Created by pfbongio on 02/11/2016.
 */
'use strict'

import {FETCH_WITH_APP_TOKEN, RETRIEVE_FETCH_APP_TOKEN} from './consts'

function _defaultAppTokenRequest (url = '/auth/users/app_token', scopes = ['web', 'api', 'ws']) {
    let data = {scopes}
    return fetch('/auth/users/app_token',
        {
            credentials: 'same-origin',
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(data)
        })
}

const fetchWithAppTokenMiddleware = (options = {}) => {
    const tokenFetchRequest = options.tokenFetchRequest || _defaultAppTokenRequest
    if (!tokenFetchRequest || typeof tokenFetchRequest !== 'function') throw new Error('tokenFetchRequest should be defined and be a function')

    const middlewareActions = {}
    middlewareActions[FETCH_WITH_APP_TOKEN] = (dispatch, action) => {

    }

    middlewareActions[RETRIEVE_FETCH_APP_TOKEN] = (dispatch, action) => {

    }

    return ({dispatch, getState}) => {
        return next => action => {
            if (action && action.type && action.type in middlewareActions) return middlewareActions[action.type](dispatch, action)
            return next(action)
        }
    }
}

export default fetchWithAppTokenMiddleware
