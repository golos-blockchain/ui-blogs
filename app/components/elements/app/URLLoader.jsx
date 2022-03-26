import React from 'react'
import { browserHistory } from 'react-router'

class URLLoader extends React.Component {
    componentDidMount() {
        window.appNavigation.onRouter((url) => {
            try {
                let parsed = new URL(url)
                browserHistory.push(parsed.pathname + parsed.search)
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
