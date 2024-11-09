import React from 'react';
import PropTypes from 'prop-types'

import Icon from 'app/components/elements/Icon'
import LinkEx from 'app/utils/LinkEx'

const isSepar = (item) => {
    return item && item.value === '-'
}

export default class VerticalMenu extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object
        ]),
        className: PropTypes.string,
        hideValue: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element
        ]),
    };

    closeMenu = (e) => {
        // If this was not a left click, or if CTRL or CMD were held, do not close the menu.
        if(e.button !== 0 || e.ctrlKey || e.metaKey) return;

        // Simulate clicking of document body which will close any open menus
        document.body.click();
    }

    render() {
        const {items, title, description, className, hideValue} = this.props;
        return <ul className={'VerticalMenu menu vertical' + (className ? ' ' + className : '')}>
            {title && <li className="title">{title}</li>}
            {description && <li className="description">{description}</li>}
            {items.map((i, k) => {
                const prev = items[k - 1]
                const next = items[k + 1]
                if(i.value === hideValue) return null
                if (isSepar(i)) {
                    return <hr key={i.key || Math.random()} />
                }
                const iconSize = i.iconSize || '1x'
                const target = i.target
                let className = ''
                if (isSepar(prev)) {
                    className += ' padd-top'
                } else if (isSepar(next)) {
                    className += ' padd-bottom'
                }
                return <li className={className} data-disabled={!!i.disabled} data-link={i.link} data-value={i.value} key={i.key ? i.key : i.value} onClick={(i.link && !i.disabled) ? this.closeMenu : null}>
                    {i.link ? <LinkEx to={!i.disabled && i.link} target={target} onClick={!i.disabled && i.onClick}>
                        {i.icon && <Icon name={i.icon} size={iconSize} />}{i.label ? i.label : i.value}
                        {i.data && <span>{i.data}</span>}
                        &nbsp; {i.addon}
                    </LinkEx> :
                    <span>
                        {i.icon && <Icon name={i.icon} size={iconSize} />}{i.label ? i.label : i.value}
                    </span>
                    }
                </li>
            })}
        </ul>;
    }
}
