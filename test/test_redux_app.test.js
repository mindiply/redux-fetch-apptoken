/**
 * Created by pfbongio on 03/11/2016.
 */
'use strict'

function saveData (data) {
    return {type: 'SAVE_DATA', data}
}

const initialState = {}

const testApp = (state = initialState, action) => {
    if (action.type === 'SAVE_DATA') {
        let result = Object.assign({}, state, action.data)
        return result
    }
    return state
}

module.exports = {
    saveData,
    testApp
}