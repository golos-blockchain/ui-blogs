import React from "react";
import PropTypes from 'prop-types'
import tt from 'counterpart';

import Icon from 'app/components/elements/Icon'

export default class OrderBookRow extends React.Component {

    static propTypes = {
        order: PropTypes.object,
        side: PropTypes.string,
        index: PropTypes.number,
        total: PropTypes.number,
        animate: PropTypes.bool
    };

    constructor(props) {
        super();

        this.state = {
            animate: props.animate && props.index !== 9,
            rowIndex: props.index
        };

        this.timeout = null;
    }

    componentDidMount() {
        if (this.state.animate) {
            this._clearAnimate();
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.state.rowIndex !== nextProps.index) {
            return this.setState({
                rowIndex: nextProps.index
            });
        }

        if (!this.props.order.equals(nextProps.order)) {
            return this.setState({animate: true}, this._clearAnimate);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !this.props.order.equals(nextProps.order) ||
            this.props.total !== nextProps.total ||
            this.state.animate !== nextState.animate
        );
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
    }

    _clearAnimate() {
        setTimeout(() => {
            this.setState({
                animate: false
            });
        }, 1000);
    }

    render() {
        const {order, prec1, prec2, side, total} = this.props;
        const bid = side === "bids";
        const activeText = order.getAsset2CurAmount() ? 'bold' : undefined;
        const tradeColor = bid ? 'green' : '#960000';
        const activeCancel = order.getAsset2CurAmount() ? <td style={{color: 'red'}} onClick={this.props.cancelSpecificOrdersClick.bind(this, order.idsToCancel)} title={tt('g.cancel')}><Icon size='0_6x' name='cross' /></td> : <td></td>;

        const totalTD = <td>{(total / Math.pow(10,prec2)).toFixed(prec2)}</td>;
        const asset2 = (<td>
            {order.getAsset2CurAmount() ? <small><span style={{color: tradeColor}}>{'(' + order.getStringAsset2Cur() + ') '}</span></small> : null}
            {order.getStringAsset2()}
        </td>);
        const asset1 = (<td>
            {order.getAsset1CurAmount() ? <small><span style={{color: tradeColor}}>{'(' + order.getStringAsset1Cur() + ') '}</span></small> : null}
            {order.getStringAsset1()}
        </td>);
        const price = <td style={{color: tradeColor, fontWeight: activeText}}>{order.getStringPrice()}</td>;

        return (
            <tr
                onClick={this.props.onClick.bind(this, order.price)}
                className={this.state.animate ? "animate" : ""}
            >
              {bid ? null : activeCancel}
              {bid ? totalTD : price}
              {bid ? asset2 : asset1}
              {bid ? asset1 : asset2}
              {bid ? price : totalTD}
              {bid ? activeCancel : null}
            </tr>
        )
    }
}
