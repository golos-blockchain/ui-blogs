import React from 'react'

class TelegramPlayer extends React.Component {
    constructor(props) {
        super(props)
        this.theRef = React.createRef()
    }

    componentDidMount() {
        const { author, id } = this.props
        let el = document.createElement('script')
        el.async = true
        el.src = 'https://telegram.org/js/telegram-widget.js?18'
        el.setAttribute('data-telegram-post', author + '/'+ id)
        el.setAttribute('data-width', '100%')
        if (this.theRef.current) {
            this.theRef.current.appendChild(el)
        }
    }

    render() {
        return <div className='TelegramPlayer' ref={this.theRef} />
    }
}

export default TelegramPlayer
