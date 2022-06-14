import React from 'react'

import { AssetEditor } from 'golos-lib-js/lib/utils'

function postDonateKey(username, is_comment) {
    return 'voteWeight-' + username + (is_comment ? '-comment' : '')
}

const getIntPercent = (fixedPct) => {
    return Math.min(Math.ceil(parseInt(fixedPct) / 100), 100)
}

export function getPostDonatePercent(username, is_comment) {
    if (process.env.BROWSER && username) {
        let voteWeight = localStorage.getItem(postDonateKey(username, is_comment))
        if (voteWeight) {
            voteWeight = getIntPercent(voteWeight)
            return voteWeight
        }
    }
    return 100
}

class FormikAgent extends React.Component {
    setVals = (username, ignoreMyVote = false) => {
        const { setFieldValue, opts, sliderMax, myVote } = this.props
        const { is_comment } = opts
        let sliderPercent = !ignoreMyVote && myVote
        if (!sliderPercent) sliderPercent = getPostDonatePercent(username, is_comment)
        setFieldValue('sliderPercent', sliderPercent)

        let amount = sliderMax.mul(sliderPercent).div(100)
        amount = amount.toString(0).split(' ')[0]
        setFieldValue('amount', AssetEditor(sliderMax).withChange(amount))
    }

    componentDidMount() {
        const { setFieldValue, currentUser, opts } = this.props
        if (currentUser) {
            const username = currentUser.get('username')
            this.setVals(username)
        }
    }

    componentDidUpdate(prevProps) {
        const { setFieldValue, currentUser, opts } = this.props
        const { sym, precision } = opts
        if (currentUser && (!prevProps.currentUser || sym !== prevProps.opts.sym)) {
            const username = currentUser.get('username')
            this.setVals(username)
        }
    }

    render() { return null }
}

export default FormikAgent
