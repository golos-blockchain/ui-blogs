package gls.blogs.core

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

const val TAG = "GLS/BootReceiver"

class BootReceiver: BroadcastReceiver() {
    override fun onReceive(ctx: Context?, intent: Intent?) {
        if (intent == null) {
            Log.e(TAG, "Boot received, but no Intent")
            return
        }
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) {
            Log.e(TAG, "Boot received, but Intent has wrong action: ${intent.action}")
            return
        }
        if (ctx != null) {
            if (ServiceHelper.loadPrefs(ctx).account != "") {
                Log.i(TAG, "Boot received, starting service")
                ServiceHelper.startNotifyService(ctx.applicationContext)
            } else {
                Log.w(TAG, "Boot received, but account in prefs is null, so we should not start service")
            }
        } else {
            Log.e(TAG, "Boot received, but no Context, so cannot start service")
        }
    }
}