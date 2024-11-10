import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
//import './EditorSwitcher.scss';

export default class EditorSwitcher extends PureComponent {
    static propTypes = {
        items: PropTypes.array.isRequired,
        activeId: PropTypes.number,
        onChange: PropTypes.func.isRequired,
        isS: PropTypes.bool,
    };

    render() {
        const { items, activeId, isS } = this.props;

        let fontSize
        if (!isS) {
            fontSize = '18px'
        }

        return (
            <div className="EditorSwitcher">
                {items.map(item => (
                    <div
                        key={item.id}
                        className={cn('EditorSwitcher__item', {
                            EditorSwitcher__item_active: item.id === activeId,
                        })}
                        style={{ fontSize }}
                        onClick={
                            item.id === activeId
                                ? null
                                : () => this.props.onChange(item.id)
                        }
                    >
                        {item.text}
                    </div>
                ))}
                <i className="EditorSwitcher__filler" />
            </div>
        );
    }
}
