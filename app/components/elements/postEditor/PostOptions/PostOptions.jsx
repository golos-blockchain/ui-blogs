import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import tt from 'counterpart';
import { isNil } from 'ramda';
import { api } from 'golos-lib-js';
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'
import {connect} from 'react-redux';
import styled from 'styled-components';

import Slider from 'golos-ui/Slider';
import Icon from 'app/components/elements/Icon';
import Hint from 'app/components/elements/common/Hint';
import RadioGroup from 'app/components/elements/common/RadioGroup';
import { PAYOUT_OPTIONS } from 'app/components/modules/PostForm/PostForm';
import './PostOptions.scss';

const SliderStyled = styled(Slider)`
    margin-top: 20px;
`;

const CuratorText = styled.p`
    margin: 0 0 6px;
    font-size: 15px;
    white-space: nowrap;
    color: #393636;
`;

const CuratorValue = styled.b`
    display: inline-block;
    width: 38px;
    text-align: left;
    font-weight: 500;
`;

const DEFAULT_DECRYPT_FEE = '100.000 GOLOS'

class PostOptions extends React.PureComponent {
    static propTypes = {
        nsfw: PropTypes.bool.isRequired,
        payoutType: PropTypes.number.isRequired,
        curationPercent: PropTypes.number.isRequired,
        decryptFee: PropTypes.object,

        editMode: PropTypes.bool,
        onNsfwClick: PropTypes.func.isRequired,
        onPayoutChange: PropTypes.func.isRequired,
        onCurationPercentChange: PropTypes.func.isRequired,
        onDecryptFeeChange: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this._onAwayClickListen = false;

        this.state = {
            showCoinMenu: false,
            showLockMenu: false,

            minCurationPercent: 0,
            maxCurationPercent: 0,

            decryptFeeEdit: AssetEditor(DEFAULT_DECRYPT_FEE),
        };
    }

    componentWillUnmount() {
        this._unmount = true;

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick);
        }
    }

    render() {

        const { editMode, decryptFee } = this.props
        const { showCoinMenu, showLockMenu, curatorPercent, minCurationPercent, maxCurationPercent, decryptFeeToSave } = this.state;
        const hasDecryptFee = (decryptFee && decryptFee.amount > 0)

        return (
            <div className="PostOptions">
                <span
                    className={cn('PostOptions__item', {
                        PostOptions__item_warning: this.props.nsfw,
                    })}
                    onClick={this.props.onNsfwClick}
                >
                    <Icon
                        name="editor/plus-18"
                        size="1_5x"
                        data-tooltip={tt('post_editor.nsfw_hint')}
                    />
                </span>
                <span className="PostOptions__item-wrapper">
                    <span
                        className={cn('PostOptions__item', {
                            PostOptions__item_active: showCoinMenu,
                        })}
                        onClick={this._onCoinClick}
                    >
                        <Icon
                            name="editor/coin"
                            size="1_5x"
                            data-tooltip={tt('post_editor.payout_hint')}
                        />
                    </span>
                    {showCoinMenu ? this._renderCoinMenu() : null}
                </span>
                {(!editMode || hasDecryptFee) ? <span className="PostOptions__item-wrapper">
                    <span
                        className={cn('PostOptions__item', {
                            PostOptions__item_active: showLockMenu,
                        })}
                        onClick={this._onLockClick}
                    >
                        <Icon
                            name={hasDecryptFee ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'}
                            size="1_5x"
                            data-tooltip={showLockMenu ? null :
                                hasDecryptFee ? (tt('post_editor.lock_hint2') + decryptFee.floatString) : tt('post_editor.lock_hint')}
                        />
                    </span>
                    {showLockMenu ? this._renderLockMenu() : null}
                </span> : null}
            </div>
        );
    }

    _renderCoinMenu() {
        const { editMode, payoutType } = this.props;

        return (
            <Hint align="center" innerRef={this._popupPayoutRef}>
                <div className="PostOptions__bubble-text">
                    {tt('post_editor.set_payout_type')}:
                </div>
                <RadioGroup
                    disabled={editMode}
                    options={PAYOUT_OPTIONS.map(({ id, title, hint }) => ({
                        id,
                        title: tt(title),
                        hint: hint ? tt(hint) : null,
                    }))}
                    value={payoutType}
                    onChange={this._onCoinModeChange}
                />
            </Hint>
        );
    }

    onDecryptFeeChange = (e) => {
        const decryptFeeEdit = this.state.decryptFeeEdit.withChange(e.target.value)
        if (decryptFeeEdit.asset.amount < 0) return
        if (this.props.editMode && decryptFeeEdit.asset.amount == 0) return

        this.setState({
            decryptFeeEdit
        })
    }

    _lockOkClick = (e) => {
        e.preventDefault()
        const { decryptFeeEdit } = this.state
        this.setState({
            decryptFeeToSave: true,
            showLockMenu: false
        }, () => {
            this.props.onDecryptFeeChange(decryptFeeEdit.asset.clone())
        })
    }

    _renderLockMenu() {
        let { decryptFeeEdit } = this.state
        return (
            <Hint align="center" innerRef={this._popupLockRef}>
                <div className="PostOptions__bubble-text">
                    {tt('post_editor.lock_hint')}:
                </div>
                <div class="input-group" style={{ marginBottom: '5px', fontSize: '90%' }}>
                    <input type="text" name="cost" value={decryptFeeEdit.amountStr} onChange={this.onDecryptFeeChange} />
                    <span class="input-group-label" style={{ paddingLeft: '7px', paddingRight: '7px' }}>
                        GOLOS
                    </span>
                </div>
                <button onClick={this._lockOkClick} className='button primary slim' style={{ paddingLeft: '15px', paddingRight: '15px', marginRight: '7px !important' }}>OK</button>
            </Hint>
        );
    }

    _onCoinClick = () => {
        this.setState(
            {
                showCoinMenu: !this.state.showCoinMenu,
            },
            () => {
                const { showCoinMenu } = this.state;

                if (showCoinMenu && !this._onAwayClickListen) {
                    window.addEventListener('mousedown', this._onAwayClick);
                    this._onAwayClickListen = true;
                }
            }
        );
    };

    _onLockClick = () => {
        const { decryptFee, editMode } = this.props
        if (!editMode && decryptFee && decryptFee.amount > 0) {
            this.setState({
                decryptFee: Asset('0.000 GOLOS'),
                decryptFeeEdit: AssetEditor(DEFAULT_DECRYPT_FEE)
            }, () => {
                this.props.onDecryptFeeChange(this.state.decryptFee.clone())
            })
            return
        }
        const { showLockMenu, } = this.state
        if (!showLockMenu && decryptFee && decryptFee.amount > 0) {
            this.setState({
                decryptFeeEdit: AssetEditor(decryptFee.clone())
            })
        }
        this.setState(
            {
                showLockMenu: !showLockMenu,
            },
            () => {
                if (this.state.showLockMenu && !this._onAwayClickListen) {
                    window.addEventListener('mousedown', this._onAwayClick);
                    this._onAwayClickListen = true;
                }
            }
        );
    };

    _onCoinModeChange = coinMode => {
        this.props.onPayoutChange(coinMode);
    };

    onCurationPercentChange = percent => {
        this.props.onCurationPercentChange(Math.round(percent * 100));
    };

    _onAwayClick = e => {
        if (!this._popupPayout || !this._popupPayout.contains(e.target)) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        showCoinMenu: false,
                    });
                }
            }, 50);
        }
        if (!this._popupLock || !this._popupLock.contains(e.target)) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        showLockMenu: false,
                    });
                }
            }, 50);
        }
    };

    _popupPayoutRef = el => {
        this._popupPayout = el
    }

    _popupLockRef = el => {
        this._popupLock = el
    }

    componentDidMount() {
      // FIXME Dirty hack
      // retry api call
      api.getChainPropertiesAsync().then(r => {
        this.setState({
          minCurationPercent: r.min_curation_percent,
          maxCurationPercent: r.max_curation_percent
        }, () => {
            this.props.onCurationPercentChange(r.min_curation_percent);
        });
      }).catch(e => {
        api.getChainPropertiesAsync().then(r => {
          this.setState({
            minCurationPercent: r.min_curation_percent,
            maxCurationPercent: r.max_curation_percent
          }, () => {
            this.props.onCurationPercentChange(r.min_curation_percent);
          });
        }).catch(e => {
          this.setState({
            minCurationPercent: 5000,
            maxCurationPercent: 9000
          })
        })
      })
    };
}

export default PostOptions;
