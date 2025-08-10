
import React from 'react'

class TestCom extends React.Component {
    render() {
        console.log(global.$STM_Config);
        const img = require('server/badge-new-nobg.svg');
        return <div>123<b>test</b>
            <span
                dangerouslySetInnerHTML={{ __html: img }}
            />
        </div>
    }
}

export default TestCom