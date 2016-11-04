# Redux fetch app token

Redux middleware that wraps fetch calls with a http header that bears
and app token.

Useful for non-full fledged HTTP bearer token OAuth2 implementations, 
like for microservice architecture that have a central authorization
microservice that grants temporary app tokens to other microservices.


# Usage

~~~
npm install --save @bongione/redux-fetch-apptoken
~~~


## When setting up your redux store

~~~
let {createStore, applyMiddleware} = require('redux')
import {fetchWithAppTokenMiddleware} from '@bongione/redux-fetch-apptoken'

const options = {
    tokenFetchRequest: (url, scopes) => { ... },
    tokenFetchUrl: '/auth/users/app_token',
    httpAppTokenHeader: 'SENECA-APP-TOKEN'
}

const store = createStore(testApp, applyMiddleware(
        fetchWithAppTokenMiddleware(options)
    ))
~~~

The options object attributes are:
* **tokenFetchRequest** a function with signature (url = '', scope = [])
  to retrieve the app tokens once the user has been authenticated
* **tokenFetchUrl** the url used to retrieve the tokens
* **httpAppTokenHeader** The HTTP header name to use where the token is
  attached to.
  
The middleware expects the token provider to return a json object of the
format
~~~
{
    token: 'TOKENSTRING',
    expires_is_s: 3600
}
~~~

## When you would usually call a fetch statement from an action

~~~
import {fetchWithAppToken} from '@bongione/redux-fetch-apptoken'

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


store.dispatch(fetchWithAppToken('test_url', {}, 'TEST', testPostFetchAction))
~~~

**fetchWithAppToken (url, fetch_options, scope, action)** takes the following parameters:
* **url** url to fetch from
* **fetch_options** options you would use for your fetch called, like method,
  credentials, body...
* **scope** The scope of the API you are calling. We expect the backend to
  be served by multiple microservices
* **action** the action to perform after the fetch. Action should be 
  a function with the following signature: 
~~~
action(fetchPromise, dispatch)
~~~  
  
  
The middleware will queue fetch requests until a valid token has been
retrieved from the backend.
  
  
  
