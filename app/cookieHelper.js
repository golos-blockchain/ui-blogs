localStorage.cookies || (localStorage.cookies = '{}');

document.__defineGetter__('cookie', function() {
    var cookieName, cookies, output, res, val, validName;
    cookies = JSON.parse(localStorage.cookies || '{}');
    output = [];
    for (cookieName in cookies) {
        val = cookies[cookieName];
        validName = cookieName && cookieName.length > 0;
        res = validName ? cookieName + "=" + val : val;
        output.push(res);
    }
    return output.join('; ');
});
document.__defineSetter__('cookie', function(s) {
    s = s.split(';')[0]
    var cookies, key, parts, value;
    parts = s.split('=');
    if (parts.length === 2) {
        key = parts[0], value = parts[1];
    } else {
        value = parts[0];
        key = '';
    }
    cookies = JSON.parse(localStorage.cookies || '{}');
    cookies[key] = value;
    localStorage.cookies = JSON.stringify(cookies);
    return key + '=' + value;
});

document.clearCookies = function() {
    return delete localStorage.cookies;
};
