import React from 'react'
import { browserHistory } from 'react-router'

class URLLoader extends React.Component {
    componentDidMount() {
        if (process.env.MOBILE_APP) {
            return
        }
        window.appNavigation.onRouter((url) => {
            try {
                let parsed = new URL(url)
                browserHistory.push(parsed.pathname + parsed.search + parsed.hash)
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
