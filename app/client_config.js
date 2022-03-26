// sometimes it's impossible to use html tags to style coin name, hence usage of _UPPERCASE modifier
export const APP_NAME = 'Голос'
export const APP_NAME_UP = 'GOLOS'
export const APP_ICON = 'golos'
// FIXME figure out best way to do this on both client and server from env
// vars. client should read $STM_Config, server should read config package.
export const APP_DOMAIN = 'golos.id'

export const LIQUID_TOKEN = 'Голос'
export const LIQUID_TOKEN_UPPERCASE = 'ГОЛОС'
export const VESTING_TOKEN = 'Сила Голоса'
export const VESTING_TOKEN2 = 'Силу Голоса'
export const VESTING_TOKENS = 'Силы Голоса'
export const DEBT_TOKEN = 'Золотой'
// these are dealing with asset types, not displaying to client, rather sending data over websocket
export const LIQUID_TICKER = 'GOLOS'
export const VEST_TICKER = 'GESTS'
export const DEBT_TICKER = 'GBG'
export const DEBT_TOKEN_SHORT = 'GBG'

export const DEFAULT_LANGUAGE = 'ru' // used on application internationalization bootstrap
export const LOCALE_COOKIE_KEY = 'gls.locale'
export const LANGUAGES = {
  ru: 'Русский',
  en: 'English',
}

// meta info
export const TWITTER_HANDLE = '@goloschain'
export const SHARE_IMAGE = 'https://' + APP_DOMAIN + '/images/golos-twshare.png'
export const TWITTER_SHARE_IMAGE = 'https://' + APP_DOMAIN + '/images/golos-twshare.png'
export const SITE_DESCRIPTION = 'Голос - платформа блогов на блокчейне. Вознаграждение пользователей осуществляется за счет эмиссии токенов, при этом распределением управляет само сообщество.'

export const FIRST_DATE = new Date(Date.UTC(2016, 7, 1)); //1 september
// ignore special tags, dev-tags, partners tags
export const IGNORE_TAGS = ['test', 'onlyblog']
export const SELECT_TAGS_KEY = 'gls.select.tags'
export const PUBLIC_API = {
  created:         'getDiscussionsByCreatedAsync',
  hot:             'getDiscussionsByHotAsync',
  trending:        'getDiscussionsByTrendingAsync',
  promoted:        'getDiscussionsByPromotedAsync',
  active:          'getDiscussionsByActiveAsync',
  responses:       'getDiscussionsByChildrenAsync',
  donates:         'getDiscussionsByDonatesAsync',
  forums:          'getAllDiscussionsByActiveAsync',
  allposts:        'getDiscussionsByPayoutAsync',
  allcomments:     'getDiscussionsByPayoutAsync',
  author:          'getDiscussionsByBlogAsync',
}

export const SEO_TITLE = 'Блокчейн Голос'
export const USER_GENDER = ['undefined', 'male', 'female']

export const CHANGE_IMAGE_PROXY_TO_STEEMIT_TIME = 1568627859000

export const CATEGORIES = [
    'голос',
    'авто',
    'бизнес',
    'блокчейн',
    'будущее',
    'дом',
    'еда',
    'животные',
    'жизнь',
    'здоровье',
    'игры',
    'искусство',
    'история',
    'кино',
    'компьютеры',
    'конкурсы',
    'криптовалюты',
    'культура',
    'литература',
    'медицина',
    'музыка',
    'наука',
    'непознанное',
    'образование',
    'политика',
    'право',
    'природа',
    'психология',
    'путешествия',
    'религия',
    'спорт',
    'творчество',
    'технологии',
    'трейдинг',
    'фотография',
    'хобби',
    'экономика',
    'юмор',
    'прочее',
    'en'
];

export const CONFETTI_CONFIG = {
    angle: "90",
    spread: "360",
    startVelocity: "20",
    elementCount: "50",
    dragFriction: "0.1",
    duration: "2000",
    stagger: 0,
    width: "10px",
    height: "10px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};
