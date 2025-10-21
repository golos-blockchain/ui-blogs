import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux'

function LocationWatch({ fireEvent }) {
    const loc = useLocation()

    useEffect(() => {
        fireEvent({
            pathname: loc.pathname
        })
    }, [loc])
}

export default connect(
    (state, props) => {
        return {
            ...props,
        }
    },
    dispatch => ({
        fireEvent: (payload) => {
            dispatch({
                type: '@@router/LOCATION_CHANGE',
                payload,
            })
        },
    })
)(LocationWatch)
