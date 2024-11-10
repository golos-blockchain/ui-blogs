import React from 'react'

const isScreenS = () => {
    const res = window.matchMedia('screen and (max-width: 39.9375em)').matches
    return res
}

const shortQuestion = '63.9375em'
const hideOrders = '710px'
const hideOrdersMe = '768px'

const hideMainMe = '800px'
const hideRewardsMe = '440px'

const hideMainFor = '560px'
const hideRewardsFor = '440px'

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
                _hideMainMe: isSmaller(hideMainMe),
                _hideRewardsMe: isSmaller(hideRewardsMe),
                _hideMainFor: isSmaller(hideMainFor),
                _hideRewardsFor: isSmaller(hideRewardsFor),
            })
        }

        render() {
            const { _shortQuestion, _hideOrders, _hideOrdersMe,
                _hideMainMe, _hideRewardsMe, _hideMainFor, _hideRewardsFor, } = this.state
            return (
                <WrappedComponent
                    isS={this.state._isSmall}
                    shortQuestion={_shortQuestion}
                    hideOrders={_hideOrders}
                    hideOrdersMe={_hideOrdersMe}
                    hideMainMe={_hideMainMe}
                    hideRewardsMe={_hideRewardsMe}
                    hideMainFor={_hideMainFor}
                    hideRewardsFor={_hideRewardsFor}
                    {...this.props}
                />
            )
        }
    }

    return ScreenSize
}
