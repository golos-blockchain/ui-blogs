package gls.blogs.core

import android.app.Application
import android.content.Context
import android.content.Context.MODE_PRIVATE
import android.content.Intent
import android.content.SharedPreferences

const val PREF_ACCOUNT = "pref_account"
const val PREF_SESSION = "pref_session"
const val PREF_SCOPES = "pref_scopes"
const val PREF_LAST_TAKE = "pref_last_take"
const val PREF_NOTIFYHOST = "pref_notify_host"

class ServiceHelper {
    companion object {
        private fun getSharedPrefs(ctx: Context): SharedPreferences {
            return ctx.getSharedPreferences("prefs", MODE_PRIVATE)
        }

        fun savePrefs(ctx: Context, prefs: AppPrefs) {
            val sharedPrefs = getSharedPrefs(ctx)
            with (sharedPrefs.edit()) {
                putString(PREF_ACCOUNT, prefs.account)
                putString(PREF_SESSION, prefs.session)
                putString(PREF_SCOPES, prefs.scopes)
                putLong(PREF_LAST_TAKE, prefs.lastTake)
                putString(PREF_NOTIFYHOST, prefs.notifyHost)
                apply()
            }
        }

        fun loadPrefs(ctx: Context): AppPrefs {
            val sharedPrefs = getSharedPrefs(ctx)
            return AppPrefs(
                sharedPrefs.getString(PREF_ACCOUNT, "")!!,
                sharedPrefs.getString(PREF_SESSION, "")!!,
                sharedPrefs.getString(PREF_SCOPES, "")!!,
                sharedPrefs.getLong(PREF_LAST_TAKE, 0),
                sharedPrefs.getString(PREF_NOTIFYHOST, "")!!
            )
        }

        fun clearPrefs(ctx: Context) {
            val sharedPrefs = getSharedPrefs(ctx)
            with (sharedPrefs.edit()) {
                remove(PREF_ACCOUNT)
                remove(PREF_SESSION)
                remove(PREF_SCOPES)
                remove(PREF_LAST_TAKE)
                remove(PREF_NOTIFYHOST)
                apply()
            }
        }

        fun startNotifyService(ctx: Context?) {
            if (ctx != null) {
                ctx.startForegroundService(Intent(ctx, NotifyService::class.java))
            }
        }

        fun stopNotifyService(ctx: Context?) {
            if (ctx != null) {
                val intent = Intent(ctx, NotifyService::class.java)
                intent.action = NotifyService.ACTION_STOP
                ctx.startService(intent)
            }
        }
    }
}
