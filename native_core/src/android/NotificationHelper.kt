package gls.blogs.core

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import gls.blogs.MainActivity
import gls.blogs.R

private const val MESSAGES_CHANNEL = "MESSAGES"
private const val MESSAGE_NOTIFICATION_ID = 2

private const val FOREGROUND_CHANNEL = "FOREGROUND"
const val FOREGROUND_NOTIFICATION_ID = 1

class NotificationHelper(val ctx: Context) {
    private val soundUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    private val notificationManager: NotificationManager =
        ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private var notifId = MESSAGE_NOTIFICATION_ID

    private fun createChannel(id: String, name: String, description: String, importance: Int, silent: Boolean = false) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(id, name, importance).apply {
                description
            }
            if (!silent) {
                channel.enableVibration(true)
                channel.setSound(soundUri, null)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createMessagesChannel() {
        createChannel(MESSAGES_CHANNEL, "Messages", "New messages notifications",
            NotificationManager.IMPORTANCE_HIGH)
    }

    private fun createForegroundChannel() {
        createChannel(
            FOREGROUND_CHANNEL, "Others", "Others channel",
            NotificationManager.IMPORTANCE_LOW, true)
    }

    private fun pendingIntent() : PendingIntent {
        val intent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        return PendingIntent.getActivity(ctx, 0, intent, PendingIntent.FLAG_IMMUTABLE)
    }

    private fun makeMessage(title: String, description: String, icon: Int): Notification {
        createMessagesChannel()

        return NotificationCompat.Builder(ctx, MESSAGES_CHANNEL)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(description)
            .setContentIntent(pendingIntent())
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSound(soundUri)
            .build()
    }

    fun notifyMessage(title: String, description: String) {
        val notification = makeMessage(title, description, R.drawable.notify)

        with(NotificationManagerCompat.from(ctx)) {
            if (notifId >= MESSAGE_NOTIFICATION_ID+2) {
                notifId = MESSAGE_NOTIFICATION_ID
            }
            notificationManager.notify(notifId++, notification)
        }
    }

    fun makeForeground(title: String, description: String, icon: Int): Notification {
        createForegroundChannel()

        return NotificationCompat.Builder(ctx, FOREGROUND_CHANNEL)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(description)
            .setContentIntent(pendingIntent())
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}