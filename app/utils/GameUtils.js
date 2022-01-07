import tt from 'counterpart'
import {vestsToSteem} from 'app/utils/StateFunctions'

export function getGameLevel(account, gprops, smallIcon = false) {
    let levels = $STM_Config.gamefication && $STM_Config.gamefication.levels
    if (levels) {
        let level = null
        let url = null
        let title = null
        try {
            let accountJS = account.toJS()
            let gpropsJS = gprops.toJS()

            let vestingSteem = vestsToSteem(accountJS.vesting_shares, gpropsJS);
            vestingSteem = parseInt(vestingSteem)
            //const receivedSteem = vestsToSteem(accountJS.received_vesting_shares, gpropsJS);
            //const delegatedSteem = vestsToSteem(accountJS.delegated_vesting_shares, gpropsJS);
            //const effectiveSteem = parseInt(vestingSteem) + parseInt(receivedSteem) - parseInt(delegatedSteem);

            let nextLevel

            for (let i = levels.length - 1; i >= 0; --i) {
                if (vestingSteem >= levels[i].power_from) {
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
                url = 'http://' + url
            }
            url = new URL('/images/gamefication/' + level.imgs[smallIcon ? 0 : level.imgs.length - 1], url).toString()
            //url = proxifyImageUrl(url, '48x48')

            let levelRange = ''
            if (level.power_from > 0) {
                levelRange = tt('user_profile.game_level_from', {
                    FROM: level.power_from
                })
            }
            if (nextLevel) {
                if (levelRange.length) {
                    levelRange += ' '
                }
                levelRange += tt('user_profile.game_level_to', {
                    TO: nextLevel.power_from
                })
            }
            const locale = tt.getLocale().startsWith('ru') ? 0 : 1
            let levelName = level.title[locale]
            title = tt('user_profile.game_level', {
                LEVEL: levelName,
                RANGE: levelRange,
            })
            if (nextLevel) {
                let nextName = nextLevel.title[locale]
                const diff = nextLevel.power_from - vestingSteem
                title += tt('user_profile.next_game_level', {
                    LEVEL: nextName,
                    DIFF: diff,
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
                level
            }
        }
    }
    return {}
}
