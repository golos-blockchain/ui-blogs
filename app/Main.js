import Iso from 'iso'

import renderApp from 'app/renderApp'

if (process.env.BROWSER){
    console.log('Client JS loaded')
} else {
    console.log('Server JS loaded')
}

if (!window.Intl) {
    require.ensure(
        ['intl/dist/Intl'],
        (require) => {
            window.IntlPolyfill = window.Intl = require('intl/dist/Intl')
            require('intl/locale-data/jsonp/en-US.js')
            Iso.bootstrap(renderApp)
        },
        'IntlBundle'
    )
} else {
    Iso.bootstrap(renderApp);
}
