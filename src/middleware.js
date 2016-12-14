/**
 * Created by pfbongio on 02/11/2016.
 */
'use strict'

import 'isomorphic-fetch'

import {FETCH_WITH_APP_TOKEN, RETRIEVE_FETCH_APP_TOKEN} from './consts'
import {retrieveFetchAppToken} from './actions'
import moment from 'moment'

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
        .then(response => response.json())
}

/**
 * Redux middleware that wraps fetch calls with a http header containing an app token
 * that is retrieved with an init action.
 * Fetch calls that are sent before the appropriate token has been received are queued until a
 * valid token is received.
 *
 * @param options container the following attributes: tokenFetchRequest which is the function used to retrieve tokens
 * @returns {function({dispatch: *, getState: *})}
 */
const fetchWithAppTokenMiddleware = (options = {}) => {
    const tokenFetchRequest = options.tokenFetchRequest || _defaultAppTokenRequest
    const tokenFetchUrl = options.tokenFetchUrl || '/auth/users/app_token'
    const httpAppTokenHeader = options.httpAppTokenHeader || 'SENECA-APP-TOKEN'
    const fetchFn = options.fetchFn || fetch
    if (!tokenFetchRequest || typeof tokenFetchRequest !== 'function') throw new Error('tokenFetchRequest should be defined and be a function')

    let currentTokenPerScope = {}

    function _hasScopeValidToken (scope) {
        if (!(scope in currentTokenPerScope)) return false
        let now = moment().utc()
        if (!currentTokenPerScope[scope].expires || currentTokenPerScope[scope].expires.isBefore(now)) return false
        return true
    }

    const middlewareActions = {}
    middlewareActions[RETRIEVE_FETCH_APP_TOKEN] = (dispatch, action) => {
        let {scopes, cb} = action
        if (!scopes || !scopes.length || scopes.length === 0) throw new Error('The action scopes attribute should be an array with at least one element')
        tokenFetchRequest(tokenFetchUrl, scopes)
            .then(result => {
                if (!result || result.result !== 'ok') throw new Error('Invalid token response from server')
                let tokenData = result.token_data
                if (!tokenData || typeof tokenData.expires_in_s !== 'number' || typeof tokenData.token !== 'string') throw new Error('Invalid token data returned')
                let expiresInSeconds = moment(tokenData.expires_in_s)
                if (expiresInSeconds < 1) throw new Error('Token already expired')
                let expireDate = moment().utc()
                expireDate.add((expiresInSeconds > 5 ? expiresInSeconds - 5 : expiresInSeconds), 'seconds')
                scopes.forEach(scope => {
                    currentTokenPerScope[scope] = {token: tokenData.token, expires: expireDate, queue: (scope in currentTokenPerScope && currentTokenPerScope[scope].queue ? currentTokenPerScope[scope].queue : [])}
                })
                if (typeof cb === 'function') cb(dispatch, tokenData)
                setInterval(() => {
                    dispatch(retrieveFetchAppToken(scopes))
                }, Math.max(60000, (expiresInSeconds - 60) * 1000))
                scopes.forEach(scope => {
                    if (scope in currentTokenPerScope && currentTokenPerScope[scope].queue && currentTokenPerScope[scope].queue.length > 0) {
                        let requestQueue = currentTokenPerScope[scope].queue.slice()
                        currentTokenPerScope[scope].queue = []
                        requestQueue.forEach(queuedRequest => {
                            dispatch(queuedRequest)
                        })
                    }
                })
            })
            .catch(err => {
                // Do nothing?
                console.log(err)
            })
    }

    middlewareActions[FETCH_WITH_APP_TOKEN] = (dispatch, action) => {
        let {scope, afterFetchAction, fetchOptions, url} = action
        if (typeof scope !== 'string') throw new Error('The scope action attribute should be a string')
        if (typeof afterFetchAction !== 'function') throw new Error('The action action attribute should be a function')
        if (typeof url !== 'string') throw new Error('Incorrect url passed')
        if (typeof fetchOptions !== 'object') throw new Error('Incorrect fetchOptions parameter')
        if (!_hasScopeValidToken(scope)) {
            if (!(scope in currentTokenPerScope)) currentTokenPerScope[scope] = {token: 'INVALID', expires: moment(), queue: []}
            currentTokenPerScope[scope].queue.push(action)
            dispatch(retrieveFetchAppToken([scope]))
            return
        }

        let mergedHeaders = Object.assign({}, fetchOptions.headers ? fetchOptions.headers : {}, {[httpAppTokenHeader]: currentTokenPerScope[scope].token})
        let mergedFetchParameters = Object.assign({}, fetchOptions, {headers: mergedHeaders})
        let fetchPromise = fetchFn(url, mergedFetchParameters).then(response => response.json())
        afterFetchAction(fetchPromise, dispatch)
    }

    return ({dispatch, getState}) => {
        return next => action => {
            if (action && action.type && action.type in middlewareActions) return middlewareActions[action.type](dispatch, action)
            return next(action)
        }
    }
}

export default fetchWithAppTokenMiddleware
