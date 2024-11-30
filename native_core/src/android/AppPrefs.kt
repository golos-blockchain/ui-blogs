package gls.blogs.core

data class AppPrefs(
    var account: String = "",
    var session: String = "",
    var scopes: String = "",
    var lastTake: Long = 0,
    var notifyHost: String = ""
    )