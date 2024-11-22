package gls.blogs.core

import android.content.Context
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CallbackContext

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import android.widget.Toast

class CorePlugin : CordovaPlugin() {
    override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext) : Boolean {
        val ctx = this.cordova.getContext()
        if (action.equals("startService")) {
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