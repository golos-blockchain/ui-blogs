import React from 'react'
import PropTypes from 'prop-types'
import Slider from 'golos-ui/Slider'

import tt from 'counterpart'

class VoteSlider extends React.Component {
    static propTypes = {
        // formik
        value: PropTypes.number.isRequired,
        onChange: PropTypes.func.isRequired,
    }

    onSliderChange = sliderPercent => {
        if (sliderPercent > 40 && sliderPercent < 60) {
            sliderPercent = 50
        }
        const { onChange } = this.props
        if (onChange) {
            onChange(sliderPercent)
        }
    }

    render() {
        const { value } = this.props
        return (<div className="row" style={{ marginTop: '1.0rem', marginBottom: '1.25rem' }}>
            <div className='column small-2'>
                {tt('g.like')}
            </div>
            <div className="column small-10">
                <Slider
                    style={{ width: 'calc(100% - 50px)', float: 'left' }}
                    min={0}
                    max={100}
                    value={value}
                    onChange={this.onSliderChange}
                />
                <div style={{ float: 'right' }}>{value + '%'}</div>
            </div>
        </div>)
    }
}

export default VoteSlider
