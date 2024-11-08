import React from 'react'

const isScreenS = () => {
    const res = window.matchMedia('screen and (max-width: 39.9375em)').matches
    return res
}

const shortQuestion = '63.9375em'
const hideOrders = '47.9375em'
const hideOrdersMe = '52.9375em'

const isSmaller = (val) => {
    const res = window.matchMedia('screen and (max-width: ' + val + ')').matches
    return res
}

export const withScreenSize = (WrappedComponent) => {
    class ScreenSize extends React.Component {
        state = {}

        componentDidMount() {
            if (!process.env.BROWSER) return
            this.updateSize()
            window.addEventListener('resize', this.onResize)
        }

        componentWillUnmount() {
            if (!process.env.BROWSER) return
            window.removeEventListener('resize', this.onResize)
        }

        onResize = () => {
            this.updateSize()
        }

        updateSize = () => {
            this.setState({
                _isSmall: isScreenS(),
                _shortQuestion: isSmaller(shortQuestion),
                _hideOrders: isSmaller(hideOrders),
                _hideOrdersMe: isSmaller(hideOrdersMe),
            })
        }

        render() {
            const { _shortQuestion, _hideOrders, _hideOrdersMe } = this.state
            return (
                <WrappedComponent
                    isS={this.state._isSmall}
                    shortQuestion={_shortQuestion}
                    hideOrders={_hideOrders}
                    hideOrdersMe={_hideOrdersMe}
                    {...this.props}
                />
            )
        }
    }

    return ScreenSize
}
