/**
 * Created by pfbongio on 03/11/2016.
 */

'use strict'

let {createStore, applyMiddleware} = require('redux')
let {fetchWithAppTokenMiddleware, fetchWithAppToken, retrieveFetchAppToken} = require('../lib')
let {saveData, testApp} = require('./test_redux_app.test')

let chai=require('chai')
let expect=chai.expect


const testResult = {
    result: 'ok',
    entity: {
        _id: 'TESTID',
        name: 'test'
    }
}

const options = {
    tokenFetchRequest: (url, scopes) => {
        return new Promise((resolve) => {
            resolve({
                token: 'TEST_TOKEN',
                expires_in_s: 6000
            })
        })
    },
    fetchFn: (url, options) => {
        return new Promise(resolve => {
            resolve({
                json: () => {
                    return new Promise(resolve => {
                        resolve(testResult)
                    })
                }
            })
        })
    }
}

function createTestStore () {
    const store = createStore(testApp, applyMiddleware(
        fetchWithAppTokenMiddleware(options)
    ))
    return store
}




function testPostFetchAction (fetch, dispatch) {
    fetch
        .then(response => response.json())
        .then(json => {
            dispatch(saveData(json))
        })
        .catch(err => {
            console.log(err)
        })
}

describe('fetchWithAppToken middleware tests', function () {
    describe('Perform an action without initializing the token service', function () {
        it('Should fetch an unitialized token and fetch the data', function (done) {
            let store = createTestStore()
            store.dispatch(fetchWithAppToken('test_url', {}, 'TEST', testPostFetchAction))
            setTimeout(() => {
                expect(store.getState().entity).to.deep.equal(testResult.entity)
                done()
            }, 1000)
        })

        it('Should first initialize the token and then send the first command', function (done) {
            let store = createTestStore()
            let cbCalled = false
            store.dispatch(retrieveFetchAppToken(['TEST', 'WS'], () => {
                cbCalled=true
            }))
            setTimeout(() => {
                store.dispatch(fetchWithAppToken('test_url', {}, 'TEST', testPostFetchAction))
                setTimeout(() => {
                    expect(cbCalled).to.equal(true)
                    expect(store.getState().entity).to.deep.equal(testResult.entity)
                    done()
                }, 500)
            }, 500)
        })
    })
})