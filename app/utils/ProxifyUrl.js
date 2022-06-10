/*global $STM_Config:false*/
/**
 * this regular expression should capture all possible proxy domains
 * Possible URL schemes are:
 * <proxy>/<file url>
 * <proxy>/{int}x{int}/<external domain and file url>
 * <proxy>/{int}x{int}/[...<proxy>/{int}x{int}/]<external domain and file url>
 * <proxy>/{int}x{int}/[<proxy>/{int}x{int}/]<proxy>/<file url>
 * @type {RegExp}
 */
const rProxyDomain = /^http(s)?:\/\/images.golos.today\//g;
const rProxyDomainsDimensions = /http(s)?:\/\/images.golos.today\/([0-9]+x[0-9]+)\//g;
const NATURAL_SIZE = '0x0/';

const fixHost = (host) => {
    if (host.endsWith('/')) {
        host = host.slice(0, -1);
    }
    return host;
};

export const proxifyImageUrl = (url, dimensions = '0x0') => {
    if (!$STM_Config || !dimensions)
      return url;
    if (dimensions[dimensions.length - 1] !== '/')
      dimensions += '/';
    let prefix = '';
    if ($STM_Config.images.img_proxy_prefix && $STM_Config.images.use_img_proxy !== false) prefix += fixHost($STM_Config.images.img_proxy_prefix) + '/' + dimensions;
    if ($STM_Config.images.img_proxy_backup_prefix) prefix += fixHost($STM_Config.images.img_proxy_backup_prefix) + '/' + dimensions;
    return prefix + url;
};

/**
 * Strips all proxy domains from the beginning of the url. Adds the global proxy if dimension is specified
 * @param {string} url
 * @param {string|boolean} dimensions - optional -  if provided. url is proxied && global var $STM_Config.img_proxy_prefix is avail. resp will be "$STM_Config.img_proxy_prefix{dimensions}/{sanitized url}"
 *                                          if falsy, all proxies are stripped.
 *                                          if true, preserves the first {int}x{int} in a proxy url. If not found, uses 0x0
 * @returns string
 */
export const proxifyImageUrlWithStrip = (url, dimensions = false) => {
  const proxyList = url.match(rProxyDomainsDimensions);
  let respUrl = url;
  if (proxyList) {
    const lastProxy = proxyList[proxyList.length - 1];
    respUrl = url.substring(url.lastIndexOf(lastProxy) + lastProxy.length);
  }
  if (dimensions && $STM_Config && ($STM_Config.images.img_proxy_prefix || $STM_Config.images.img_proxy_backup_prefix)) {
    let dims = dimensions + '/';
    if (typeof dimensions !== 'string') {
      dims = proxyList
        ? proxyList.shift().match(/([0-9]+x[0-9]+)\//g)[0]
        : NATURAL_SIZE;
    }
    if (NATURAL_SIZE !== dims || !rProxyDomain.test(respUrl)) {
      return proxifyImageUrl(respUrl, dims);
    }
  }
  return respUrl;
};
