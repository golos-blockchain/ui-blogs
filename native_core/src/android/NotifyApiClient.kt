package gls.blogs.core

import android.util.Log
import okhttp3.HttpUrl
import okhttp3.Request
import org.json.JSONObject

class NotifyApiClient(notifyHost: String) : ApiClient(notifyHost) {
    var session = ""

    override fun reqBuilder(url: HttpUrl): Request.Builder {
        val builder = super.reqBuilder(url)
        return builder.header("X-Session", session)
    }

    public fun subscribe(acc: String, scopes: String) : Int {
        val url = urlBuilder().addPathSegments("subscribe/@$acc/$scopes").build()
        val request = reqBuilder(url).build()

        val json = callForJSON(request, "Cannot subscribe")
        try {
            return json.getInt("subscriber_id")
        } catch (e: Exception) {
            throw Exception("Cannot subscribe, error: " + json.optString("error"))
        }
    }

    data class TakeResult(
        var removeTaskIds: ArrayList<String> = ArrayList<String>(),
        var lastTake: Long = 0
    ) {}

    public fun take(acc: String, subId: String, callback: (String, JSONObject) -> Unit, removeTaskIds: String?): TakeResult {
        var builder = urlBuilder().addPathSegments("take/@$acc/$subId")
        if (removeTaskIds != null) {
            builder = builder.addPathSegment(removeTaskIds)
        }

        val request = reqBuilder(builder.build()).build()

        val json = callForJSON(request, "Cannot take", 61000)
        try {
            val lastTake = json.getLong("__")
            val tasks = json.getJSONArray("tasks")
            var removeTaskIds = ArrayList<String>()
            (0 until tasks.length()).forEach {
                val task = tasks.getJSONObject(it)

                val data = task.getJSONArray("data")
                val type = data.getString(0)
                val op = data.getJSONObject(1)

                callback(type, op)

                val taskId = task.getString("id")
                removeTaskIds.add(taskId)
            }
            return TakeResult(removeTaskIds, lastTake)
        } catch (e: Exception) {
            e.printStackTrace()
            throw Exception(json.getString("error"))
        }
    }

    public fun getInbox(acc: String, lastTake: Long, callback: (JSONObject) -> Unit) {
        var builder = urlBuilder().addPathSegments("msgs/get_inbox/@$acc")
            .addQueryParameter("unread_only", "true")
        val request = reqBuilder(builder.build()).build()
        val json = callForJSON(request, "Cannot getInbox")
        try {
            val results = json.getJSONArray("result")
            for (index in 0 until results.length()) {
                val result = results.getJSONObject(index)

                val time = result.getLong("__time")

                if (time >= lastTake) {
                    callback(result)
                } else {
                    break
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            throw Exception(json.getString("error"))
        }
    }
}