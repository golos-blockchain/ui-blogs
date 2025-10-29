package gls.blogs.core

import android.app.Service
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.widget.Toast
import android.util.Log
import org.json.JSONObject
import kotlin.concurrent.thread
import gls.blogs.R

class NotifyService() : Service() {
    companion object {
        private const val TAG = "GLS/NotifyService"

        const val ACTION_STOP = "ACTION_STOP"
    }

    private lateinit var nac: NotifyApiClient
    private lateinit var nh: NotificationHelper
    private lateinit var prefs: AppPrefs
    private var workThread: Thread? = null

    private var subId = ""

    private fun showNotification(descr: String) {
        Handler(Looper.getMainLooper()).post {
            nh.notifyMessage("GOLOS Блоги", descr)
        }
    }

    private fun doLoop(removeTaskIds: ArrayList<String>) {
        if (Thread.interrupted()) return

        if (subId.isEmpty()) {
            try {
                subId = nac?.subscribe(prefs.account, prefs.scopes).toString()
            } catch (e: Exception) {
                e.printStackTrace()
                Thread.sleep(5000)
                doLoop(removeTaskIds)
                return
            }
            Log.i(TAG, "NotifyService subscribed $subId")

            if (Thread.interrupted()) return
        }

        if (Thread.interrupted()) return

        var entries = ArrayList<String>()
        val rti = removeTaskIds.joinToString(",")
        var newRTI = ArrayList<String>()
        try {
            val takeRes = nac?.take(prefs.account, subId, { typ: String, op: JSONObject ->
                var entry = typ + ":" + op.toString()
                val author = op.optString("author", "")
                val parent_author = op.optString("parent_author", "")
                if (typ == "comment_reply") {
                    val _depth = op.optInt("_depth", 0)
                    if (_depth > 1) {
                        entry = "@" + author + " ответил на ваш комментарий."
                    } else {
                        entry = "@" + author + " прокомментировал ваш пост."
                    }
                } else if (typ == "comment_mention") {
                    if (parent_author != "") {
                        entry = "@" + author + " упомянул вас в комментарии."
                    } else {
                        entry = "@" + author + " упомянул вас в своем посте."
                    }
                }
                entries.add(entry)
            }, rti)
            newRTI = takeRes!!.removeTaskIds

            if (Thread.interrupted()) return

            prefs.lastTake = takeRes!!.lastTake
            ServiceHelper.savePrefs(applicationContext, prefs)

            for (i in 0 until entries.size) {
                showNotification(entries[i])
            }
        } catch (e: Exception) {
            e.printStackTrace()
            if (e.message != null && e.message!!.contains("No such queue")) {
                Log.e(TAG, "No such queue - resubscribing")
                subId = ""
            }
        }
        Thread.sleep(2500)
        doLoop(newRTI)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return  null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		if (intent != null && intent.action == ACTION_STOP) {
            if (workThread != null) {
				workThread!!.interrupt()
                stopForeground(true)
                stopSelfResult(startId)
            }
            return START_STICKY
        }

        nh = NotificationHelper(this)
        val n = nh.makeForeground(" ", "GOLOS Блоги работают.", R.drawable.ic_empty)
        startForeground(FOREGROUND_NOTIFICATION_ID, n)

        Log.i(TAG, "Started")

        prefs = ServiceHelper.loadPrefs(applicationContext)
        nac = NotifyApiClient(prefs.notifyHost)
        nac.session = prefs.session

        workThread = thread { 
            try {
                doLoop(ArrayList<String>())
            } catch (e: InterruptedException) {
                Log.i(TAG, "Service stopped - InterruptedException", e)
            }
        }

        return START_STICKY
    }
}
