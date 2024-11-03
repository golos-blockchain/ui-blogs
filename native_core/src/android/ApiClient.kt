package gls.blogs.core

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONObject
import java.util.concurrent.TimeUnit

open class ApiClient(val host: String) {
    private var client: OkHttpClient = OkHttpClient()

    fun urlBuilder(): HttpUrl.Builder {
        return host.toHttpUrl().newBuilder()
    }

    open fun reqBuilder(url: HttpUrl): Request.Builder {
        return Request.Builder()
            .url(url)
    }

    private fun call(req: Request, err: String, timeoutMsec : Long? = null) : Response {
        try {
            var clientBuilder = client.newBuilder()
            if (timeoutMsec != null) {
                clientBuilder = clientBuilder.readTimeout(timeoutMsec, TimeUnit.MILLISECONDS)
            }
            return clientBuilder.build().newCall(req).execute()
        } catch (e: Exception) {
            e.printStackTrace()
            throw Exception(err)
        }
    }

    private fun getJSON(str: String, err: String) : JSONObject {
        try {
            return JSONObject(str)
        } catch (e: Exception) {
            e.printStackTrace()
            throw Exception(err)
        }
    }

    fun callForJSON(req: Request, err: String, timeoutMsec : Long? = null) : JSONObject {
        val res = call(req, err, timeoutMsec)
        val str = res.body?.string()
        return getJSON(str!!, err)
    }
}