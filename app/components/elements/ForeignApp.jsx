import React from 'react'

class ForeignApp extends React.Component {
    render() {
        const { foreignApp } = this.props
        return (foreignApp.url ? <a href={foreignApp.url} target='_blank' rel='noopener noreferrer'>
            <span className="ForeignApp">
                {foreignApp.domain}
            </span>
            </a> : <span className="ForeignApp">
                {foreignApp.domain}
            </span>)
    }
}

export default ForeignApp
