import React from 'react'
import tt from 'counterpart'

class Sponsors extends React.Component {
    constructor(props) {
        super(props)
    }

    createNew = (e) => {

    }

    render() {
        let settings

        settings = <span>
            {tt('sponsors_jsx.not_yet') + ' '}
            <a href='#' onClick={this.createNew}>{tt('sponsors_jsx.create_it')}</a>
            {tt('sponsors_jsx.to_be_able_to_create_paid_posts')}
        </span>

        return <div style={{ paddingBottom: '1rem' }}>
            <h3 id='sponsorship'>{tt('sponsors_jsx.title')}</h3>
            {settings}
        </div>
    }
}

export default Sponsors
