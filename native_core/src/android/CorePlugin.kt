package gls.blogs.core

import android.content.Context
import android.os.Build
import android.Manifest
import android.util.Log
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CallbackContext

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import android.widget.Toast

class CorePlugin : CordovaPlugin() {
    companion object {
        private const val TAG = "GLS/CorePlugin"
    }

    override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext) : Boolean {
        val ctx = this.cordova.getContext()
        if (action.equals("initNativeCore")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                Log.e(TAG, "Checking notification permission");
                if (!this.cordova.hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
                    Log.e(TAG, "Requesting notification permission");
                    this.cordova.requestPermission(this, 1001, Manifest.permission.POST_NOTIFICATIONS);
                }
            }
            callbackContext.success()
        } else if (action.equals("startService")) {
            var prefs = AppPrefs()
            prefs.account = args.getString(0)
            prefs.session = args.getString(1)
            prefs.scopes = args.getString(2)
            prefs.lastTake = args.getLong(3)
            prefs.notifyHost = args.getString(4)
            // And not passing subscriber id because service should subscribe again
            ServiceHelper.savePrefs(ctx, prefs)
            ServiceHelper.startNotifyService(ctx)
            callbackContext.success()
        } else if (action.equals("stopService")) {
            ServiceHelper.stopNotifyService(ctx)
            callbackContext.success()
        } else if (action.equals("logout")) {
            ServiceHelper.clearPrefs(ctx)
        }
        return false
    }
}