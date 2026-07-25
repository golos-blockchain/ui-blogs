import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import cn from 'classnames'
import tt from 'counterpart'

import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl'
import CircularProgress from './CircularProgress'

const Userpic = ({
    account,
    votingPower,
    showProgress: initialShowProgress = false,
    progressClass,
    imageUrl,
    title,
    onClick,
    width = 48,
    height = 48,
    hideIfDefault = false,
    json_metadata,
    reputation,
    hideReputationForSmall
}) => {
    const [showProgress, setShowProgress] = useState(initialShowProgress)
    const [showPower, setShowPower] = useState(false)

    const extractUrl = useCallback(() => {
        let url = null

        if (imageUrl) {
            url = imageUrl
        } else {
            try {
                const md = JSON.parse(json_metadata)
                if (md.profile) url = md.profile.profile_image
            } catch (e) {
                console.warn('Try to extract image url from users metaData failed!')
            }
        }

        if (url && /^(https?:)\/\//.test(url)) {
            const size = width && width > 75 ? '200x200' : '75x75'
            url = proxifyImageUrlWithStrip(url, size)
        } else {
            if (hideIfDefault) {
                return null
            }
            url = require('app/assets/images/user.png')
        }

        return url
    }, [imageUrl, json_metadata, width, hideIfDefault])

    const votingPowerToPercents = useCallback(power => power / 100, [])

    const toggleProgress = useCallback(() => {
        setShowProgress(prev => !prev)
        setShowPower(prev => !prev)
    }, [])

    const getVotingIndicator = useCallback((percentage) => {
        const votingClasses = cn('voting_power', {
            'show-progress': showProgress,
            'show-power': showPower
        }, progressClass)

        return (
            <div className={votingClasses}>
                <CircularProgress
                    percentage={percentage}
                    show={showProgress}
                    size={width}
                    strokeWidth={2.5}
                />
            </div>
        )
    }, [showProgress, showPower, progressClass, width])

    const style = {
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${extractUrl()})`
    }

    if (votingPower) {
        const percentage = votingPowerToPercents(votingPower)
        const toggle = showProgress ? () => {} : toggleProgress

        return (
            <div className='Userpic' title={title} onClick={toggle} style={style}>
                {percentage ? getVotingIndicator(percentage) : null}
            </div>
        )
    } else if (reputation !== undefined) {
        return (
            <div className='Userpic_parent' onClick={onClick}>
                <div className='Userpic' title={title} style={style}></div>
                <div className='Userpic__badge' title={tt('g.reputation')}>{reputation}</div>
            </div>
        )
    } else {
        return <div className='Userpic' title={title} style={style} onClick={onClick} />
    }
}

Userpic.propTypes = {
    account: PropTypes.string,
    votingPower: PropTypes.number,
    showProgress: PropTypes.bool,
    progressClass: PropTypes.string,
    imageUrl: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
    hideIfDefault: PropTypes.bool,
    json_metadata: PropTypes.string,
    reputation: PropTypes.number,
    hideReputationForSmall: PropTypes.bool
}

const mapStateToProps = (state, props) => {
    const { account, width, height, hideIfDefault, onClick } = props

    return {
        json_metadata: state.global.accounts &&
            state.global.accounts[account] &&
            state.global.accounts[account].json_metadata,
        width,
        height,
        hideIfDefault,
        onClick
    }
}

export default connect(mapStateToProps)(Userpic)
