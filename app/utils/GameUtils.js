import tt from 'counterpart'
import { toAsset, vestsToSteem } from 'app/utils/StateFunctions'

export function getGameLevel(account, gprops, smallIcon = false) {
    let levels = $STM_Config.gamefication && $STM_Config.gamefication.levels
    if (levels) {
        let level = null
        let url = null
        let title = null
        let levelName = null
        try {
            let accountJS = account.toJS()
            let gpropsJS = gprops.toJS()

            let vestingSteem = vestsToSteem(accountJS.vesting_shares, gpropsJS);
            vestingSteem = parseInt(vestingSteem)
            //const receivedSteem = vestsToSteem(accountJS.received_vesting_shares, gpropsJS);
            //const delegatedSteem = vestsToSteem(accountJS.delegated_vesting_shares, gpropsJS);
            //const effectiveSteem = parseInt(vestingSteem) + parseInt(receivedSteem) - parseInt(delegatedSteem);
            let pct = vestingSteem * 100 / toAsset(gpropsJS.total_vesting_fund_steem).amount

            let nextLevel

            for (let i = levels.length - 1; i >= 0; --i) {
                if (pct >= levels[i].power_from) {
                    level = levels[i]
                    break
                }
                nextLevel = levels[i]
            }
            if (!level) {
                level = levels[0]
            }

            url = $STM_Config.site_domain
            if (!url.startsWith('http')) {
                url = 'https://' + url
            }
            url = new URL('/images/gamefication/' + level.imgs[smallIcon ? 0 : level.imgs.length - 1], url).toString()
            //url = proxifyImageUrl(url, '48x48')

            const locale = tt.getLocale().startsWith('ru') ? 0 : 1

            levelName = level.title[locale]
            pct = pct.toFixed(2)
            if (pct === '0.00') {
                pct = '~0.0001'
            }
            title = tt('user_profile.game_level', {
                LEVEL: levelName,
                STAKE: pct,
                GP: vestingSteem,
            })

            if (nextLevel) {
                let nextName = nextLevel.title[locale]
                const nextGP = toAsset(gpropsJS.total_vesting_fund_steem).amount * nextLevel.power_from / 100
                const diffGP = nextGP - vestingSteem
                title += tt('user_profile.next_game_level', {
                    LEVEL: nextName,
                    GP_DIFF: Math.floor(diffGP),
                })
            }
        } catch (err) {
            console.error('gamefication error:', err)
            url = null
        }
        if (url) {
            return {
                levelUrl: url,
                levelTitle: title,
                levelName,
                level
            }
        }
    }
    return {}
}
