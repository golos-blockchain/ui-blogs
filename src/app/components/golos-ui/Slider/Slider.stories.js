import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import Slider from './Slider';

storiesOf('Golos UI/Slider', module)
    .add(
        'default', () => {
            const [ val, setVal, ] = useState(0);
            return (<Slider
                style={{ width: '200px' }}
                value={val}
                onChange={value => setVal(value)}
            />);
        }
    )
    .add(
        'captions', () => {
            const [ val, setVal, ] = useState(0);
            return (<Slider
                showCaptions
                style={{ width: '200px' }}
                value={val}
                onChange={value => setVal(value)}
            />);
        }
    );
