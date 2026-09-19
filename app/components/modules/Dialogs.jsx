import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';
import g from 'app/redux/GlobalReducer';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import QrReader from 'app/components/elements/QrReader';
import CheckLoginOwner from 'app/components/elements/CheckLoginOwner';
import QrKeyView from 'app/components/elements/QrKeyView';
import PromotePost from 'app/components/modules/PromotePost';

class Dialogs extends React.Component {
    static propTypes = {
        active_dialogs: PropTypes.object,
        hide: PropTypes.func.isRequired,
    }

    constructor() {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Dialogs')
        this.hide = (name) => {
            this.props.hide(name)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const {active_dialogs, hide} = nextProps
        Object.keys(active_dialogs).forEach(k => {
            if(!this['hide_' + k])
                this['hide_' + k] = () => hide(k)
        })
    }

    render() {
        const {active_dialogs} = this.props
        let idx = 0
        const dialogs = Object.entries(active_dialogs).reduce((r, [k, v]) => {
            const cmp = k === 'qr_reader' ? <span key={idx++} >
                <Reveal onHide={this['hide_' + k]} show revealStyle={{width: '355px'}} >
                    <CloseButton onClick={this['hide_' + k]} />
                    <QrReader onClose={this['hide_' + k]} {...v.params} />
                </Reveal>
            </span>:
            k === 'promotePost' ? <span key={idx++} >
                <Reveal onHide={this['hide_' + k]} show>
                    <CloseButton onClick={this['hide_' + k]} />
                    <PromotePost onClose={this['hide_' + k]} {...v.params} />
                </Reveal>
            </span>:
            k === 'qr_key' ? <span key={idx++} >
                <Reveal onHide={this['hide_' + k]} show>
                    <CloseButton onClick={this['hide_' + k]} />
                    <QrKeyView onClose={this['hide_' + k]} {...v.params} />
                </Reveal>
           </span>:
            null
            if (cmp) r.push(cmp)
            return r
        }, [])
        return <div>
            {dialogs}
            <CheckLoginOwner />
        </div>
    }
}

export default connect(
    state => {
        return {
            active_dialogs: state.global.active_dialogs || {},
        }
    },
    dispatch => ({
        hide: name => {
            dispatch(g.actions.hideDialog({name}))
        },
    })
)(Dialogs)
