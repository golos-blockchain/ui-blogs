import tt from 'counterpart';

import { authUrl, } from 'app/utils/AuthApiClient'

export function capitalizeFirstLetter(s) {
  return s.charAt(0).toUpperCase() + s.substring(1);
}

function fractional_part_len(value) {
    const parts = (Number(value) + '').split('.');
    return parts.length < 2 ? 0 : parts[1].length;
}

// 123456 or '123456' -> '134.456 GOLOS'
// also usable for percents but sym should be trimmed
export const longToAsset = (value, sym = 'GOLOS', decPlaces = 3) => {
    let prec = Math.pow(10, decPlaces);
    let val_int = parseInt(value);
    let int_part = parseInt(Math.abs(val_int) / prec) + '';
    let fract_part = (Math.abs(val_int) % prec) + '';
    fract_part = fract_part.padStart(decPlaces, '0');
    if (decPlaces > 0)
      return (val_int < 0 ? '-' : '') + int_part + '.' + fract_part + ' ' + sym;
    else
      return (val_int < 0 ? '-' : '') + int_part + ' ' + sym;
}

// '134.456 GOLOS' => 123456
export const assetToLong = (asset) => {
  return parseInt(asset.split(' ')[0].replace('.', ''));
}

// FIXME this should be unit tested.. here is one bug: 501,695,.505
export function formatDecimal(value, decPlaces = 2, truncate0s = true, thouSeparator = ',') {
    let decSeparator, fl, i, j, sign, abs_value;
    if (value === null || value === void 0 || isNaN(value)) {
        return 'NaN';
    }
    if (truncate0s) {
        fl = fractional_part_len(value);
        if (fl < 2) fl = 2;
        if (fl < decPlaces) decPlaces = fl;
    }
    decSeparator = '.';
    sign = value < 0 ? '-' : '';
    abs_value = Math.abs(value);
    i = parseInt(abs_value.toFixed(decPlaces), 10) + '';
    j = i.length;
    j = i.length > 3 ? j % 3 : 0;
    const decPart = (decPlaces ? decSeparator + Math.abs(abs_value - i).toFixed(decPlaces).slice(2) : '');
    return [sign + (j ? i.substr(0, j) + thouSeparator : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thouSeparator), decPart];
}

export function formatAsset(value, withSym=true, withCents=false, thouSeparator=' ') {
  let ret = formatDecimal(value.split(' ')[0], 3, false, thouSeparator);
  if (!withCents) ret = ret[0];
  if (withSym) ret += ' ' + value.split(' ')[1];
  return ret;
}

export function parsePayoutAmount(amount) {
    return parseFloat(String(amount).replace(/\s[A-Z]*$/, ''));
}

/**
    This is a rough approximation of log10 that works with huge digit-strings.
    Warning: Math.log10(0) === NaN
    The 0.00000001 offset fixes cases of Math.log(1000)/Math.LN10 = 2.99999999~
*/
function log10(str) {
    const leadingDigits = parseInt(str.substring(0, 4));
    const log = Math.log(leadingDigits) / Math.LN10 + 0.00000001
    const n = str.length - 1;
    return n + (log - parseInt(log));
}

export const repLog10 = rep2 => {
    if(rep2 == null) return rep2
    let rep = String(rep2)
    const neg = rep.charAt(0) === '-'
    rep = neg ? rep.substring(1) : rep

    let out = log10(rep)
    if(isNaN(out)) out = 0
    out = Math.max(out - 9, 0); // @ -9, $0.50 earned is approx magnitude 1
    out = (neg ? -1 : 1) * out
    out = (out * 9) + (neg ? 0 : 25) // 9 points per magnitude. center at 25
    // base-line 0 to darken and < 0 to auto hide (grep rephide)
    if (neg && out === 0) out = -1;
    out = parseInt(out)
    return out
}

export function formatAmount(amount){
    amount = amount.replace(/[^\d\.\,]/g,"").replace(/,/, '.');
    return amount
}

export function checkMemo(memoValue){
    return typeof memoValue !== 'undefined'
        && ((memoValue.length == 52 && /[PK5]/.test(memoValue.charAt(0))) || (memoValue.length == 51 && /[5J]/.test(memoValue.charAt(0))))
}

export function countDecimals(amount) {
    if(amount == null) return amount
    amount = String(amount).match(/[\d\.]+/g).join('') // just dots and digits
    const parts = amount.split('.')
    return parts.length > 2 ? undefined : parts.length === 1 ? 0 : parts[1].length
}

// this function searches for right translation of provided error (usually from back-end)
export function translateError(string) {
    if (typeof(string) != 'string') return string
    switch (string) {
        case 'Account not found':
            return tt('g.account_not_found')
        case 'Incorrect Password':
            return tt('g.incorrect_password')
        case 'Username does not exist':
            return tt('g.username_does_not_exist')
        case 'Account name should be longer.':
            return tt('g.account_name_should_be_longer')
        case 'Account name should be shorter.':
            return tt('g.account_name_should_be_shorter')
        case 'Account name should start with a letter.':
            return tt('g.account_name_should_start_with_a_letter')
        case 'Account name should have only letters, digits, or dashes.':
            return tt('g.account_name_should_have_only_letters_digits_or_dashes')
        case 'vote currently exists, user must be indicate a desire to reject witness':
            return tt('g.vote_currently_exists_user_must_be_indicate_a_to_reject_witness')
        case 'Only one Steem account allowed per IP address every 10 minutes':
            return tt('g.only_one_APP_NAME_account_allowed_per_ip_address_every_10_minutes')
        case 'Cannot increase reward of post within the last minute before payout':
            return tt('g.cannot_increase_reward_of_post_within_the_last_minute_before_payout')
        default:
            return string
    }
}

export function authorURL(name) {
  return "https://" + APP_DOMAIN + "/@" + name;
}

export function getAuthorPermlink(url) {
  var res = ['', ''];
  url = url.trim();
  url = url.split('?')[0];
  const authIdx = url.lastIndexOf('/@');
  if (authIdx === -1) return res;
  url = url.substr(authIdx + 2);
  const permIdx = url.lastIndexOf('/');
  if (permIdx === -1) return res;
  const author = url.substring(0, permIdx);
  const permlink = url.substr(permIdx + 1);
  if (author === '' || permlink === '') return res;
  res = [author, permlink];
  return res;
}


export function ERR(err, opType) {
  let errorStr = err.toString();
  let errorKey = errorStr;
  switch (opType) {
    case 'worker_request':
      if (errorStr.includes('required_amount_min.amount must be >0')) {
        errorKey = 'Минимальная сумма не должна быть 0.';
      } else if (errorStr.includes('must be GOLOS or GBG')) {
        errorKey = 'Сумма должна быть в GOLOS или GBG.';
      } else if (errorStr.includes('must be GOLOS')) {
        errorKey = 'Выплата в VESTS возможна только при сумме в GOLOS.';
      } else if (errorStr.includes('required_amount')) {
        errorKey = 'Неверно указана сумма.';

      } else if (errorStr.includes('duration must be between')) {
        errorKey = 'Дата окончания голосования раньше 5 дней или позже 30 дней.';
      } else if (errorStr.includes('worker_request.duration = -')) {
        errorKey = 'Дата окончания голосования указана в прошлом.';
      } else if (errorStr.includes('duration')) {
        errorKey = 'Дата окончания голосования указана неверно.';

      } else if (errorStr.includes('"author": invalid value') || errorStr.includes('"permlink": invalid value')) {
        errorKey = 'Неверная ссылка на пост.'

      } else if (errorStr.includes('enough fund')) {
        errorKey = 'Не хватает средств на Вашем балансе GBG - не удается списать плату за создание заявки.';

      } else if (errorStr.includes('Missing account with id')) {
        errorKey = 'Аккаунт воркера указан неверно.'

      } else if (errorStr.includes('cashout window')) {
        errorKey = 'Пост слишком старый - должно пройти не более 7 дней с момента создания поста.';
      } else if (errorStr.includes('Missing comment')) {
        errorKey = 'Пост не найден. Неверная ссылка на пост.';

      } else if (errorStr.includes('Cannot modify approved')) {
        errorKey = 'Голосование по заявке завершено - редактировать нельзя.';
      }
      break;
    case 'worker_request_vote':
      if (errorStr.includes('Request closed, cannot vote')) {
        errorKey = 'Заявка закрыта, голосовать нельзя.';
      } else if (errorStr.includes('Request already paying')) {
        errorKey = 'Заявка уже прошла порог СГ и выплачивается, голосование закрыто.';
      }
      break;
    case 'worker_request_delete':
      if (errorStr.includes('Request already closed')) {
        errorKey = 'Заявка уже закрыта или удалена.';
      }
      break;
    case 'search_by_author':
      if (errorStr.includes('Account name')) {
        errorKey = 'Неверное имя автора.';
      }
      break;
    default:
      break;
  }
  return errorKey;
}

//  Missing Active Authority gsteem
// copypaste from https://gist.github.com/tamr/5fb00a1c6214f5cab4f6
// (it have been modified: ий > iy and so on)
// this have been done beecause we cannot use special symbols in url (`` and '')
// and url seems to be the only source of thruth
var d = /\s+/g,
    //rus = "щ  ш   ч   ц   ю   ю   я   я  ые   ий  ё   ё   ж   ъ   э   ы   а   б   в   г   д   е   з   и   й   к   л   м   н   о   п   р   с   т   у   ф   х   х   ь".split(d),
    //eng = "sch    sh  ch  cz  yu  ju  ya  q  yie  iy  yo  jo  zh  w   ye  y   a   b   v   g   d   e   z   i   yi  k   l   m   n   o   p   r   s   t   u   f   x   h   j".split(d);

	rus = "щ    ш  ч  ц  й  ё  э  ю  я  х  ж  а б в г д е з и к л м н о п р с т у ф ъ  ы ь ґ є і ї".split(d),
	eng = "shch sh ch cz ij yo ye yu ya kh zh a b v g d e z i k l m n o p r s t u f xx y x g e i i".split(d);

export function detransliterate(str, reverse) {
    if (!str) return str
    if (!reverse && str.substring(0, 4) !== 'ru--') return str
    if (!reverse) str = str.substring(4)

    // TODO rework this
    // (didnt placed this earlier because something is breaking and i am too lazy to figure it out ;( )
    if(!reverse) {
    //    str = str.replace(/j/g, 'ь')
    //    str = str.replace(/w/g, 'ъ')
        str = str.replace(/yie/g, 'ые')
    }
    else {
    //    str = str.replace(/ь/g, 'j')
    //    str = str.replace(/ъ/g, 'w')
        str = str.replace(/ые/g, 'yie')
    }

    var i,
        s = /[^[\]]+(?=])/g, orig = str.match(s),
        t = /<(.|\n)*?>/g, tags = str.match(t);

    if(reverse) {
        for(i = 0; i < rus.length; ++i) {
            str = str.split(rus[i]).join(eng[i]);
            str = str.split(rus[i].toUpperCase()).join(eng[i].toUpperCase());
        }
    }
    else {
        for(i = 0; i < rus.length; ++i) {
            str = str.split(eng[i]).join(rus[i]);
            str = str.split(eng[i].toUpperCase()).join(rus[i].toUpperCase());
        }
    }

    if(orig) {
        var restoreOrig = str.match(s);

        for (i = 0; i < restoreOrig.length; ++i)
            str = str.replace(restoreOrig[i], orig[i]);
    }

    if(tags) {
        var restoreTags = str.match(t);

        for (i = 0; i < restoreTags.length; ++i)
            str = str.replace(restoreTags[i], tags[i]);

        str = str.replace(/\[/g, '').replace(/\]/g, '');
    }

    return str;
}
