import React, { useState, useEffect, useRef, useCallback } from 'react'
import cn from 'classnames'
import debounce from 'lodash/debounce'

const RAISE_TIME = 350
let key = 0

const TooltipManager = () => {
    const [tooltip, setTooltip] = useState(null)
    const hoverElementRef = useRef(null)
    const hoverTextRef = useRef(null)
    const elementBoundRef = useRef(null)
    const timeoutRef = useRef(null)
    const checkIntervalRef = useRef(null)

    const resetTooltips = useCallback(() => {
        hoverElementRef.current = null
        hoverTextRef.current = null
        elementBoundRef.current = null

        onMouseMove.cancel()
        clearTimeout(timeoutRef.current)

        if (tooltip) {
            hideTooltip()
        }
    }, [tooltip])

    const hideTooltip = useCallback(() => {
        clearInterval(checkIntervalRef.current)
        setTooltip(null)
    }, [])

    const showTooltip = useCallback(() => {
        const element = hoverElementRef.current
        const bound = element.getBoundingClientRect()

        elementBoundRef.current = bound

        setTooltip({
            key: ++key,
            text: hoverTextRef.current,
            addClass: bound.left < 100
                ? 'Tooltip_left'
                : bound.right > window.innerWidth - 100
                    ? 'Tooltip_right'
                    : null,
            style: {
                top: Math.round(bound.top + window.scrollY),
                left: Math.round(bound.left + bound.width / 2),
            },
        })

        checkIntervalRef.current = setInterval(checkElement, 500)
    }, [])

    const checkElement = useCallback(() => {
        if (!hoverElementRef.current.isConnected) {
            resetTooltips()
            return
        }

        const b = elementBoundRef.current
        const bound = hoverElementRef.current.getBoundingClientRect()

        if (b.top !== bound.top || b.left !== bound.left) {
            resetTooltips()
        }
    }, [resetTooltips])

    const onMouseMove = useCallback(debounce((e) => {
        const tooltipEl = e.target.closest('[data-tooltip]')
        const text = tooltipEl ? tooltipEl.dataset.tooltip.trim() : null

        if (tooltipEl && text === hoverTextRef.current) {
            hoverElementRef.current = tooltipEl
            return
        }

        resetTooltips()

        if (tooltipEl && text) {
            hoverElementRef.current = tooltipEl
            hoverTextRef.current = text

            timeoutRef.current = setTimeout(() => {
                showTooltip()
            }, RAISE_TIME)
        }
    }, 50), [resetTooltips, showTooltip])

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove, true)
        document.addEventListener('resize', resetTooltips)
        document.addEventListener('mousedown', resetTooltips, true)
        document.addEventListener('keydown', resetTooltips, true)
        window.addEventListener('scroll', resetTooltips)

        return () => {
            document.removeEventListener('mousemove', onMouseMove, true)
            document.removeEventListener('resize', resetTooltips)
            document.removeEventListener('mousedown', resetTooltips, true)
            document.removeEventListener('keydown', resetTooltips, true)
            window.removeEventListener('scroll', resetTooltips)

            resetTooltips()
        }
    }, [onMouseMove, resetTooltips])

    return (
        <div>
            {tooltip ? (
                <div
                    key={tooltip.key}
                    className={cn('Tooltip', tooltip.addClass)}
                    style={tooltip.style}
                >
                    {tooltip.text}
                </div>
            ) : null}
        </div>
    )
}

export default TooltipManager
