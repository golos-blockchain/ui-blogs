import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import tt from 'counterpart';
import { isNil } from 'ramda';
import { api } from 'golos-lib-js';
import {connect} from 'react-redux';
import styled from 'styled-components';
import Slider from 'golos-ui/Slider';
import Icon from 'app/components/elements/Icon';
import Hint from 'app/components/elements/common/Hint';
import RadioGroup from 'app/components/elements/common/RadioGroup';
import { PAYOUT_OPTIONS, VISIBLE_OPTIONS, VISIBLE_TYPES } from 'app/components/modules/PostForm/PostForm';
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

class PostOptions extends React.PureComponent {
    static propTypes = {
        nsfw: PropTypes.bool.isRequired,
        visibleType: PropTypes.number.isRequired,
        publishedLimited: PropTypes.bool.isRequired,
        payoutType: PropTypes.number.isRequired,
        curationPercent: PropTypes.number.isRequired,

        editMode: PropTypes.bool,
        onNsfwClick: PropTypes.func.isRequired,
        onVisibleTypeChange: PropTypes.func.isRequired,
        onPayoutChange: PropTypes.func.isRequired,
        onCurationPercentChange: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this._onAwayClickListen = false;

        this.state = {
            showEyeMenu: false,
            showCoinMenu: false,

            minCurationPercent: 0,
            maxCurationPercent: 0,
        };
    }

    componentWillUnmount() {
        this._unmount = true;

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick);
        }
    }

    render() {
      const { showEyeMenu, showCoinMenu, curatorPercent, minCurationPercent, maxCurationPercent } = this.state;
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
                            PostOptions__item_warning: !showEyeMenu && this.props.visibleType !== VISIBLE_TYPES.ALL,
                            PostOptions__item_active: showEyeMenu
                        })}
                        onClick={this._onEyeClick}
                    >
                        <Icon
                            name="editor/visible"
                            size="1_5x"
                            data-tooltip={tt('post_editor.set_visible_type')}
                        />
                    </span>
                    {showEyeMenu ? this._renderEyeMenu() : null}
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
            </div>
        );
    }

    _renderEyeMenu() {
        const { editMode, publishedLimited, visibleType } = this.props;

        const disableChoice = editMode && publishedLimited

        return (
            <Hint align="center" innerRef={this._popupEyeRef}>
                <div className="PostOptions__bubble-text">
                    {tt('post_editor.set_visible_type')}:
                </div>
                <RadioGroup
                    disabled={disableChoice}
                    title={disableChoice ? tt('post_editor.onlyapp_cannot_be_removed') : ''}
                    options={VISIBLE_OPTIONS.map(({ id, title, hint }) => ({
                        id,
                        title: tt(title) + ' ',
                        hint: hint ? tt(hint) : null,
                    }))}
                    value={visibleType}
                    onChange={this.props.onVisibleTypeChange}
                />
            </Hint>
        );
    }

    _onEyeClick = () => {
        this.setState(
            {
                showEyeMenu: !this.state.showEyeMenu,
            },
            () => {
                const { showEyeMenu } = this.state;

                if (showEyeMenu && !this._onAwayClickListen) {
                    window.addEventListener('mousedown', this._onAwayClick);
                    this._onAwayClickListen = true;
                }
            }
        );
    };

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

    _onCoinModeChange = coinMode => {
        this.props.onPayoutChange(coinMode);
    };

    onCurationPercentChange = percent => {
        this.props.onCurationPercentChange(Math.round(percent * 100));
    };

    _onAwayClick = e => {
        if ((!this._popupEye || !this._popupEye.contains(e.target)) &&
            (!this._popupPayout || !this._popupPayout.contains(e.target))) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        showEyeMenu: false,
                        showCoinMenu: false,
                    });
                }
            }, 50);
        }
    };

    _popupEyeRef = el => {
        this._popupEye = el
    }

    _popupPayoutRef = el => {
        this._popupPayout = el
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
