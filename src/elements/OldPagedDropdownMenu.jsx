import React from 'react';
import PropTypes from 'prop-types';
import DropdownMenu from 'app/components/elements/DropdownMenu';

export default class OldPagedDropdownMenu extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        selected: PropTypes.string,
        children: PropTypes.object,
        className: PropTypes.string,
        title: PropTypes.string,
        href: PropTypes.string,
        el: PropTypes.string.isRequired,
        noArrow: PropTypes.bool
    };

    render() {
        const {el, items, selected, children, className, title, href, noArrow} = this.props;
        return (<DropdownMenu 
            children={children}
            title={title}
            href={href}
            noArrow={noArrow}
            className={className}
            items={items}
            selected={selected}
            el={el} />)
    }
};