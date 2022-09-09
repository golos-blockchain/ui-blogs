import React from 'react';
import {connect} from 'react-redux'
import user from 'app/redux/User';
import g from 'app/redux/GlobalReducer';
import tt from 'counterpart';
import throttle from 'lodash/throttle'
import transaction from 'app/redux/Transaction'
import { getMetadataReliably } from 'app/utils/NormalizeProfile';
import DoNotBother from 'app/components/elements/DoNotBother';
import Icon from 'app/components/elements/Icon';
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import Userpic from 'app/components/elements/Userpic';
import reactForm from 'app/utils/ReactForm'
import {fromJS, Set, Map} from 'immutable'
import UserList from 'app/components/elements/UserList';
import ContentSettings from 'app/components/elements/settings/ContentSettings'
import cookie from "react-cookie";
import Dropzone from 'react-dropzone'
import { LANGUAGES, DEFAULT_LANGUAGE, LOCALE_COOKIE_KEY, USER_GENDER } from 'app/client_config'

class Settings extends React.Component {

    constructor(props) {
        super()
        this.initForm(props)
        this.onDonatePresetChange = this.onDonatePresetChange.bind(this)
    }

    state = {
        errorMessage: '',
        successMessage: '',
        pImageUploading: false,
        cImageUploading: false,
    }

    initForm(props) {
        reactForm({
            instance: this,
            name: 'accountSettings',
            fields: ['profile_image', 'cover_image', 'name', 'gender', 'about', 'location', 'website'],
            initialValues: props.profile,
            validation: values => ({
                profile_image: values.profile_image && !/^https?:\/\//.test(values.profile_image) ? tt('settings_jsx.invalid_url') : null,
                cover_image: values.cover_image && !/^https?:\/\//.test(values.cover_image) ? tt('settings_jsx.invalid_url') : null,
                name: values.name && values.name.length > 20 ? tt('settings_jsx.name_is_too_long') : values.name && /^\s*@/.test(values.name) ? tt('settings_jsx.name_must_not_begin_with') : null,
                gender: values.gender && values.gender.length > 20 ? tt('settings_jsx.name_is_too_long') : values.gender && /^\s*@/.test(values.gender) ? tt('settings_jsx.name_must_not_begin_with') : null,
                about: values.about && values.about.length > 160 ? tt('settings_jsx.about_is_too_long') : null,
                location: values.location && values.location.length > 30 ? tt('settings_jsx.location_is_too_long') : null,
                website: values.website && values.website.length > 100 ? tt('settings_jsx.website_url_is_too_long') : values.website && !/^https?:\/\//.test(values.website) ? tt('settings_jsx.invalid_url') : null,
            })
        })
        this.handleSubmitForm =
            this.state.accountSettings.handleSubmit(args => this.handleSubmit(args))
    }

    UNSAFE_componentWillMount() {
        const {accountname} = this.props
        const {vesting_shares} = this.props.account
        
        let donatePresets, emissionDonatePct, notifyPresets;

        if(process.env.BROWSER){
            donatePresets = localStorage.getItem('donate.presets-' + accountname)
            if (donatePresets) donatePresets = JSON.parse(donatePresets)
        }
        if (!donatePresets) donatePresets = ['5','25','50']
        if (donatePresets.length > 3) {
            donatePresets = [donatePresets[0], donatePresets[2], donatePresets[3]]
        }

        if(process.env.BROWSER) {
            emissionDonatePct = localStorage.getItem('donate.emissionpct-' + accountname)
        }
        if(!emissionDonatePct) emissionDonatePct = '10'
        this.setState({donatePresets : donatePresets, emissionDonatePct})

        if (process.env.BROWSER){
            notifyPresets = localStorage.getItem('notify.presets-' + accountname)
            if (notifyPresets) notifyPresets = JSON.parse(notifyPresets)
            if (notifyPresets && notifyPresets.fill_order === undefined) {
                notifyPresets.fill_order = true;
            }
        }
        if (!notifyPresets) notifyPresets = {
            receive: true, donate: true, comment_reply: true, mention: true, message: true, fill_order: true,
        }
        this.setState({notifyPresets})
    }

    onDrop = (acceptedFiles, rejectedFiles) => {
      if(!acceptedFiles.length) {
        if(rejectedFiles.length) {
        this.setState({progress: {error: tt('reply_editor.please_insert_only_image_files')}})
        console.log('onDrop Rejected files: ', rejectedFiles);
      }
      return
      }
      const file = acceptedFiles[0]
      this.upload(file, file.name)
    }

    // fixme remove all the code duplication below

    onDropCover = (acceptedFiles, rejectedFiles) => {
    if(!acceptedFiles.length) {
      if(rejectedFiles.length) {
        this.setState({progress: {error: tt('reply_editor.please_insert_only_image_files')}})
        console.log('onDrop Rejected files: ', rejectedFiles);
      }
      return
    }
    const file = acceptedFiles[0]
    this.uploadCover(file, file.name)
  }

    onOpenClick = () => {
      this.dropzone.open();
    }

    onOpenCoverClick = () => {
      this.dropzoneCover.open();
    }

    upload = (file, name = '') => {
      const {notify} = this.props;
      const {uploadImage} = this.props
      this.setState({pImageUploading: true})
      uploadImage(file, progress => {
        if(progress.url) {
          const {profile_image: {props: {onChange}}} = this.state;
          // ok. change input url
          onChange(progress.url)
        }
        if(progress.error) {
          // error
          const { error } = progress;
          // show error notification
          notify(error, 10000)
        }
        this.setState({pImageUploading: false})
      })
    }

    uploadCover = (file, name = '') => {
      const {notify} = this.props;
      const {uploadImage} = this.props
      this.setState({cImageUploading: true})
      uploadImage(file, progress => {
        if(progress.url) {
          const {cover_image: {props: {onChange}}} = this.state;
          // ok. change input url
          onChange(progress.url)
        }
        if(progress.error) {
          // error
          const { error } = progress;
          // show error notification
          notify(error, 10000)
        }
      this.setState({cImageUploading: false})
      })
    }

    onDonatePresetChange(e) {
        if (!e.currentTarget.validity.valid || e.currentTarget.value == '') {
          return;
        }
        const donatePresets = this.state.donatePresets.map((item, j) => {
          if (j == e.currentTarget.dataset.id) {
            return e.currentTarget.value;
          }
          return item;
        });
        this.setState({donatePresets});
        const {accountname} = this.props;
        localStorage.setItem('donate.presets-'+accountname, JSON.stringify(donatePresets));
        this.notifyThrottled()
    }

    onEmissionDonatePctChange = (e) => {
        const { accountname } = this.props
        const emissionDonatePct = e.target.value
        this.setState({ emissionDonatePct })
        localStorage.setItem('donate.emissionpct-' + accountname, emissionDonatePct)
        this.notifyThrottled()
    }

    notify = () => {
        this.props.notify(tt('g.saved'))
    }

    notifyThrottled = throttle(this.notify, 2000)

    onLanguageChange = (event) => {
        const language = event.target.value
        cookie.save(LOCALE_COOKIE_KEY, language, {path: "/", expires: new Date(Date.now() + 60 * 60 * 24 * 365 * 10 * 1000)});
        localStorage.setItem('language', language)
        this.props.changeLanguage(language)
        this.notify()
    }

    handleSubmit = ({updateInitialValues}) => {
        let {metaData} = this.props
        if (!metaData) metaData = {}

        //fix https://github.com/GolosChain/tolstoy/issues/450
        if (typeof metaData === 'string' && metaData.localeCompare("{created_at: 'GENESIS'}") == 0) {
            metaData = {}
            metaData.created_at = 'GENESIS'
        }

        if(!metaData.profile) metaData.profile = {}
        delete metaData.user_image; // old field... cleanup

        const {profile_image, cover_image, name, gender, about, location, website} = this.state

        // Update relevant fields
        metaData.profile.profile_image = profile_image.value
        metaData.profile.cover_image = cover_image.value
        metaData.profile.name = name.value
        metaData.profile.gender = gender.value
        metaData.profile.about = about.value
        metaData.profile.location = location.value
        metaData.profile.website = website.value

        // Remove empty keys
        if(!metaData.profile.profile_image) delete metaData.profile.profile_image;
        if(!metaData.profile.cover_image) delete metaData.profile.cover_image;
        if(!metaData.profile.name) delete metaData.profile.name;
        if(!metaData.profile.gender) delete metaData.profile.gender;
        if(!metaData.profile.about) delete metaData.profile.about;
        if(!metaData.profile.location) delete metaData.profile.location;
        if(!metaData.profile.website) delete metaData.profile.website;

        const {account, updateAccount} = this.props
        this.setState({loading: true})
        updateAccount({
            json_metadata: JSON.stringify(metaData),
            account: account.name,
            memo_key: account.memo_key,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('updateAccount ERROR', e)
                    this.setState({
                        loading: false,
                        changed: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                this.setState({
                    loading: false,
                    changed: false,
                    errorMessage: '',
                    successMessage: tt('g.saved') + '!',
                })
                // remove successMessage after a while
                setTimeout(() => this.setState({successMessage: ''}), 4000)
                updateInitialValues()
            }
        })
    }

    unmuteAsset = (e) => {
        const sym = e.currentTarget.dataset.sym;
        let mutedUIA = [];
        mutedUIA = localStorage.getItem('mutedUIA');
        if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
        if (!mutedUIA) mutedUIA = [];
        mutedUIA = mutedUIA.filter(o => o !== sym)
        localStorage.setItem('mutedUIA', JSON.stringify(mutedUIA));
        window.location.reload()
    }

    onNotifyPresetChange = e => {
        let notifyPresets = {...this.state.notifyPresets};
        notifyPresets[e.target.dataset.type] = e.target.checked;
        this.setState({
            notifyPresets,
            notifyPresetsTouched: true,
        });
    }

    onNotifyPresetsSubmit = e => {
        const { accountname } = this.props;
        localStorage.setItem('notify.presets-' + accountname,
            JSON.stringify(this.state.notifyPresets));
        this.setState({
            notifyPresetsTouched: false,
        })
    }

    render() {
        const {state, props} = this
        
        const {submitting, valid, touched} = this.state.accountSettings
        const disabled = !props.isOwnAccount || state.loading || submitting || !valid || !touched

        const {profile_image, cover_image, name, about, gender, location, website, donatePresets, emissionDonatePct, notifyPresets, notifyPresetsTouched} = this.state

        const {follow, block, account, isOwnAccount} = this.props
        const following = follow && follow.getIn(['getFollowingAsync', account.name]);
        const ignores = isOwnAccount && block && block.getIn(['blocking', account.name, 'result'])
        const mutedInNew = isOwnAccount && props.mutedInNew;
        let mutedUIA = [];
        if (process.env.BROWSER) {
          mutedUIA = localStorage.getItem('mutedUIA');
          if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
          if (!mutedUIA) mutedUIA = [];
        }
        let mutedUIAlist = [];
        for (let sym of mutedUIA) {
          mutedUIAlist.push(<p key={sym}>{sym}&nbsp;<a data-sym={sym} onClick={this.unmuteAsset}>X</a></p>)
        }
        const {pImageUploading, cImageUploading} = this.state;

        const languageSelectBox = <select defaultValue={process.env.BROWSER ? cookie.load(LOCALE_COOKIE_KEY) : DEFAULT_LANGUAGE} onChange={this.onLanguageChange}>
          {Object.keys(LANGUAGES).map(key => {
            return <option key={key} value={key}>{LANGUAGES[key]}</option>
          })}
        </select>;

        const selectorStyle = pImageUploading ?
          {
            whiteSpace: `nowrap`,
            display: `flex`,
            alignItems: `center`,
            padding: `0 6px`,
            pointerEvents: `none`,
            cursor: `default`,
            opacity: `0.6`
          } :
          {
            display: `flex`,
            alignItems: `center`,
            padding: `0 6px`
          };

          const selectorStyleCover = cImageUploading ?
            {
              whiteSpace: `nowrap`,
              display: `flex`,
              alignItems: `center`,
              padding: `0 6px`,
              pointerEvents: `none`,
              cursor: `default`,
              opacity: `0.6`
            } :
            {
              display: `flex`,
              alignItems: `center`,
              padding: `0 6px`
            };
        
        return <div className="Settings">

            <div className="row">
                <form onSubmit={this.handleSubmitForm} className="small-12 medium-8 large-6 columns">
                    <h3>{tt('settings_jsx.public_profile_settings')}</h3>

                    <label>
                        {tt('settings_jsx.choose_language')}
                        {languageSelectBox}
                    </label>
                    <div className="error"></div>

                    <label>
                        {tt('settings_jsx.choose_preset_tips')}
                        <div>
                          <input type="number" className="Donate_presets" min="1" step="1" max="99999" data-id="0" value={this.state.donatePresets[0]} onChange={this.onDonatePresetChange} />
                          <input type="number" className="Donate_presets" min="1" step="1" max="99999" data-id="1" value={this.state.donatePresets[1]} onChange={this.onDonatePresetChange} />
                          <input type="number" className="Donate_presets" min="1" step="1" max="99999" data-id="2" value={this.state.donatePresets[2]} onChange={this.onDonatePresetChange} />
                        </div>
                    </label>
                    <div className="error"></div>

                    <label>
                        {tt('settings_jsx.emission_donate_pct')}
                        <div>
                          <input type="number" min="1" step="1" max="100" value={emissionDonatePct} onChange={this.onEmissionDonatePctChange} />
                        </div>
                    </label>
                    <div className="error"></div>

                    <label>
                        {tt('settings_jsx.profile_image_url')}
                        <div style={{display: `flex`, alignItems: `stretch`, alignContent: `stretch`}}>
                          <Dropzone style={{width: `100%`}}
                                    onDrop={this.onDrop}
                                    className={'none'}
                                    disableClick multiple={false} accept="image/*"
                                    ref={(node) => { this.dropzone = node; }}>
                              <input ref={(r) => this.pImageUrlInput = r}
                                     type="url" {...profile_image.props}
                                     autoComplete="off"
                                     disabled={pImageUploading}
                              />
                          </Dropzone>
                          <a onClick={this.onOpenClick}
                             style={selectorStyle}>
                                {pImageUploading ? `${tt(`user_saga_js.image_upload.uploading`)} ...` : tt(`g.upload`)}
                          </a>
                        </div>
                    </label>
                    <div className="error">{profile_image.blur && profile_image.touched && profile_image.error}</div>

                    <label>
                    {tt('settings_jsx.cover_image_url')}
                    <div style={{display: `flex`, alignItems: `stretch`, alignContent: `stretch`}}>
                      <Dropzone style={{width: `100%`}}
                                onDrop={this.onDropCover}
                                className={'none'}
                                disableClick multiple={false} accept="image/*"
                                ref={(node) => { this.dropzoneCover = node; }}>
                        <input ref={(r) => this.pCoverImageUrlInput = r}
                               type="url" {...cover_image.props}
                               autoComplete="off"
                               disabled={cImageUploading}
                        />
                      </Dropzone>
                      <a onClick={this.onOpenCoverClick}
                         style={selectorStyleCover}>
                        {cImageUploading ? `${tt(`user_saga_js.image_upload.uploading`)} ...` : tt(`g.upload`)}
                      </a>
                    </div>
                  </label>

                    {/*<label>*/}
                        {/*{tt('settings_jsx.cover_image_url')}*/}
                        {/*<input type="url" {...cover_image.props} autoComplete="off" />*/}
                    {/*</label>*/}

                    <div className="error">{cover_image.blur && cover_image.touched && cover_image.error}</div>

                    <label>
                        {tt('settings_jsx.profile_name')}
                        <input type="text" {...name.props} maxLength="20" autoComplete="off" />
                    </label>
                    <div className="error">{name.touched && name.error}</div>

                    <label>
                        {tt('settings_jsx.profile_gender.title')}
                        <select {...gender.props}>
                            {USER_GENDER.map(i => {
                                return <option key={i} value={i}>{tt('settings_jsx.profile_gender.genders.' + i)}</option>
                                })
                            }
                        </select>
                    </label>
                    <div className="error">{gender.touched && gender.error}</div>

                    <label>
                        {tt('settings_jsx.profile_about')}
                        <input type="text" {...about.props} maxLength="160" autoComplete="off" />
                    </label>
                    <div className="error">{about.touched && about.error}</div>

                    <label>
                        {tt('settings_jsx.profile_location')}
                        <input type="text" {...location.props} maxLength="30" autoComplete="off" />
                    </label>
                    <div className="error">{location.touched && location.error}</div>

                    <label>
                        {tt('settings_jsx.profile_website')}
                        <input type="url" {...website.props} maxLength="100" autoComplete="off" />
                    </label>
                    <div className="error">{website.blur && website.touched && website.error}</div>

                    <br />
                    {state.loading && <span><LoadingIndicator type="circle" /><br /></span>}
                    {!state.loading && <input type="submit" className="button" value={tt('settings_jsx.update')} disabled={disabled} />}
                    {' '}{
                            state.errorMessage
                                ? <small className="error">{state.errorMessage}</small>
                                : state.successMessage
                                ? <small className="success uppercase">{state.successMessage}</small>
                                : null
                        }
                </form>
            </div>

            {isOwnAccount && <ContentSettings account={props.accountname} />}

            {isOwnAccount &&
                <div className="row">
                    <div className="small-12 medium-8 large-6 columns Notification_presets">
                        <br /><br />
                        <h3>{tt('settings_jsx.notifications_settings')}</h3>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.receive} data-type='receive' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/transfer' size='2x' />
                            <span>{tt('settings_jsx.notifications_transfer')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.donate} data-type='donate' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/donate' size='2x' />
                            <span>{tt('settings_jsx.notifications_donate')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.comment_reply} data-type='comment_reply' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/comment' size='2x' />
                            <span>{tt('settings_jsx.notifications_reply')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.mention} data-type='mention' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/mention' size='2x' />
                            <span>{tt('settings_jsx.notifications_mention')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.message} data-type='message' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/message' size='2x' />
                            <span>{tt('settings_jsx.notifications_message')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.fill_order} data-type='fill_order' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/order' size='2x' />
                            <span>{tt('settings_jsx.notifications_order')}</span>
                        </label>
                        <br />
                        <input
                            type="submit"
                            onClick={this.onNotifyPresetsSubmit}
                            className="button"
                            value={tt('settings_jsx.update')}
                            disabled={!this.state.notifyPresetsTouched}
                        />
                    </div>
                </div>}

            {mutedUIA && mutedUIA.length > 0 &&
                <div className="row">
                    <div className="small-12 columns">
                        <br /><br />
                        <h3>{tt('settings_jsx.muted_uia')}</h3>
                        {mutedUIAlist}
                    </div>
                </div>}

            <DoNotBother account={account} />

            {ignores && ignores.size > 0 &&
                <div className="row">
                    <div className="small-12 columns">
                        <br /><br />
                        <UserList title={tt('settings_jsx.muted_users')} account={account} users={ignores} />
                    </div>
                </div>}

            {mutedInNew && mutedInNew.size > 0 &&
                <div className="row">
                    <div className="small-12 columns">
                        <br /><br />
                        <UserList title={tt('settings_jsx.muted_in_new_users')} account={account} users={mutedInNew} muteOnlyNew={true} />
                    </div>
                </div>}

        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {accountname} = ownProps.routeParams
        const account = state.global.getIn(['accounts', accountname]).toJS()
        const current_user = state.user.get('current')
        const username = current_user ? current_user.get('username') : ''
        let metaData = account ? getMetadataReliably(account.json_metadata) : {}
        const profile = metaData && metaData.profile ? metaData.profile : {}
        const mutedInNew = metaData && metaData.mutedInNew ? Set(metaData.mutedInNew) : Set([])

        return {
            account,
            metaData,
            accountname,
            isOwnAccount: username == accountname,
            profile,
            mutedInNew,
            block: state.global.get('block'),
            follow: state.global.get('follow'),
            ...ownProps
        }
    },
    // mapDispatchToProps
    dispatch => ({
        uploadImage: (file, progress) => {
        dispatch({
          type: 'user/UPLOAD_IMAGE',
          payload: {file, progress},
        })
      },
        changeLanguage: (language) => {
            dispatch(user.actions.changeLanguage(language))
        },
        updateAccount: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'account_metadata', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        },
        notify: (message, dismiss = 3000) => {
            dispatch({type: 'ADD_NOTIFICATION', payload: {
                key: "settings_" + Date.now(),
                message,
                dismissAfter: dismiss}
            });
        }
    })
)(Settings)
