/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import tt from 'counterpart';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'

import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import Follow from 'app/components/elements/Follow';
import Icon from 'app/components/elements/Icon';
import {authorNameAndRep} from 'app/utils/ComponentFormatters';
import { getGameLevel } from 'app/utils/GameUtils'
import Reputation from 'app/components/elements/Reputation';
import Userpic from 'app/components/elements/Userpic';
import normalizeProfile from 'app/utils/NormalizeProfile';
import { msgsHost, msgsLink } from 'app/utils/ExtLinkUtils'

const {string, bool, number} = PropTypes;

class Author extends React.Component {
    static propTypes = {
        author: string.isRequired,
        follow: bool,
        mute: bool,
        authorRepLog10: number,
        donateUrl: string,
    };
    static defaultProps = {
        follow: true,
        mute: true,
    };

    constructor() {
        super();
        this.showProfileCtrl = this.showProfileCtrl.bind(this);
        this.openDropdown = React.createRef()
    }

    componentDidMount() {
        const element = document.querySelector('.FoundationDropdownMenu__label');
        if (element) element.addEventListener("click", this.showProfileCtrl, false);
    }

    componentWillUnmount() {
        const element = document.querySelector('.FoundationDropdownMenu__label');
        if (element) element.removeEventListener("click", this.showProfileCtrl, false);
    }

    showProfileCtrl(e) {
        if (e.metaKey || e.ctrlKey) { // handle edge case for ctrl clicks
            e.stopPropagation();
            window.location = '/@' + this.props.author;
        } else { // show default author preview
        }
    }

    onLevelClick = () => {
        this.openDropdown.current.click()
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'Author');
    render() {
        const {author, follow, mute, authorRepLog10, donateUrl, forceMsgs} = this.props; // html
        const {username} = this.props; // redux

        let levelTitle
        let level = () => null
        if (this.props.account) {
            const levData = getGameLevel(this.props.account, this.props.gprops, true)
            levelTitle = levData.levelTitle
            if (levData.levelUrl) {
                level = (myAccount = false, clickable = false) => 
                    (<img src={levData.levelUrl} title={levData.levelName} onClick={clickable ? this.onLevelClick : undefined} style={{
                        height: '24px',
                        marginRight: myAccount ? '1px' : '3px',
                        marginLeft: myAccount ? '6px' : '1px',
                        cursor: clickable ? 'pointer' : 'auto',
                    }} />)
            }
        }

        const msgs_btn = msgsHost() ? (<a href={msgsLink(author)} rel='noopener noreferrer' target='_blank' title={tt('g.write_message_long')} className='Author__write'>
                <Icon name="new/envelope" />
            </a>) : null

        const author_link = <span className="author" itemProp="author" itemScope itemType="http://schema.org/Person">
            <Link to={'/@' + author}><strong>{author}</strong></Link>
            {!(follow || mute) ? <Reputation value={authorRepLog10} /> : level(true)}
            {forceMsgs ? msgs_btn : null}
        </span>;

        if(!(follow || mute) || username === author)
            return author_link;

        const {name, gender, about} = this.props.account ? normalizeProfile(this.props.account.toJS()) : {};

        let genderIcon;
        if (gender && gender != 'undefined')
            genderIcon = <span><Icon className='Author__gender' name={gender} /></span>

        const dropdown = <div className="Author__dropdown">
            <Link to={'/@' + author}>
                <Userpic account={author} width="75" height="75"
                    reputation={authorRepLog10} />
            </Link>
            <Link to={'/@' + author} className="Author__name">
                {name}
                {name ? genderIcon : null}
            </Link>
            <Link to={'/@' + author} className="Author__username">
                @{author}
            </Link>
            {!name ? genderIcon : null}
            <div>
                <Follow className="float-right" follower={username} following={author} what="blog"
                        showFollow={follow} showMute={mute} donateUrl={donateUrl}
                        />
            </div>

            <div className="Author__bio">
                {about}
                {levelTitle ? (<div style={{
                    marginTop: ((about && about.length) ? '0.5rem' : '0px'),
                    fontSize: '75%',
                    color: '#8a8a8a'
                }}>{levelTitle}</div>) : null}
            </div>
        </div>;

        return (
            <span className="Author">
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="left"
                    dropdownContent={dropdown}
                >
                    <span ref={this.openDropdown} className="FoundationDropdownMenu__label">
                        <span itemProp="author" itemScope itemType="http://schema.org/Person">
                            <strong>{author}</strong>
                        </span>
                        <Icon name="dropdown-arrow" />
                    </span>
                </LinkWithDropdown>
                {level(false, true)}
                {msgs_btn}
            </span>
        )
    }
}

import {connect} from 'react-redux'
export default connect(
    (state, ownProps) => {
        const {author, follow, mute, authorRepLog10} = ownProps;
        const username = state.user.getIn(['current', 'username']);
        const account = state.global.getIn(['accounts', author]);
        const gprops = state.global.get('props')
        return {
            author, follow, mute, authorRepLog10,
            username,
            account,
            gprops,
        }
    },
)(Author)
