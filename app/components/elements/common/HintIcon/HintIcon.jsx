import React, { useState, useEffect, useRef, useCallback } from 'react'

import Icon from 'app/components/elements/Icon'

const HintIcon = ({ hint }) => {
    const [isShow, setIsShow] = useState(false)
    const bubbleRef = useRef(null)
    const unmountRef = useRef(false)

    const toggleHint = useCallback((enable) => {
        if (enable) {
            setIsShow(true)
            window.addEventListener('mousedown', onAwayClick)
        } else {
            setIsShow(false)
            window.removeEventListener('mousedown', onAwayClick)
        }
    }, [])

    const onAwayClick = useCallback((e) => {
        if (!bubbleRef.current.contains(e.target)) {
            setTimeout(() => {
                if (!unmountRef.current) {
                    toggleHint(false)
                }
            }, 50)
        }
    }, [toggleHint])

    const onClick = useCallback((e) => {
        e.preventDefault()
        toggleHint(true)
    }, [toggleHint])

    const onCloseClick = useCallback(() => {
        toggleHint(false)
    }, [toggleHint])

    useEffect(() => {
        return () => {
            unmountRef.current = true
            window.removeEventListener('mousedown', onAwayClick)
        }
    }, [onAwayClick])

    const renderHint = () => {
        return (
            <div className='HintIcon__bubble' ref={bubbleRef}>
                <Icon className='HintIcon__close' name='cross' onClick={onCloseClick} />
                <span className='HintIcon__text'>{hint}</span>
            </div>
        )
    }

    return (
        <div className='HintIcon'>
            <Icon
                name='editor/info'
                className='HintIcon__icon'
                onClick={onClick}
            />
            {isShow ? renderHint() : null}
        </div>
    )
}

export default HintIcon
