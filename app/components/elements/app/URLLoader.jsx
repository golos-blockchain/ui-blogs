import React from 'react'
import { navigateOutside } from 'app/utils/routing'

class URLLoader extends React.Component {
    componentDidMount() {
        if (process.env.MOBILE_APP) {
            return
        }
        window.appNavigation.onRouter((url) => {
            try {
                let parsed = new URL(url)
                navigateOutside(parsed.pathname + parsed.search + parsed.hash)
            } catch (error) {
                console.error(error)
            }
        })
    }


    render() {
        return null
    }
}

export default URLLoader
