import React from 'react'

class MarketInput extends React.Component {
    render() {
        const { label, symbol, rowTitle, ...rest } = this.props
        return (<div className="row" title={rowTitle}>
                <div className="column small-3 large-3" style={{ paddingRight: '0px' }}>
                    <label>{label}</label>
                </div>
                <div className="column small-9 large-7">
                    <div className="input-group">
                        <input
                            className="input-group-field"
                            type="text"
                            {...rest}
                        />
                        <span className="input-group-label uppercase">
                            {symbol}
                        </span>
                    </div>
                </div>
            </div>)
    }
}

export default MarketInput
