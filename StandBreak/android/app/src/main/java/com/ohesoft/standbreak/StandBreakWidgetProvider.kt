package com.ohesoft.standbreak

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class StandBreakWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val ACTION_TICK = "com.ohesoft.standbreak.WIDGET_TICK"

        fun updateAllWidgets(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, StandBreakWidgetProvider::class.java))
            for (id in ids) {
                updateWidget(context, mgr, id)
            }
        }

        private fun updateWidget(context: Context, mgr: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(WidgetDataModule.PREFS, Context.MODE_PRIVATE)
            val breakCount = prefs.getInt("break_count", 0)
            val moveMinutes = prefs.getInt("move_minutes", 0)
            val streak = prefs.getInt("streak", 0)

            val breakText = "$breakCount breaks"
            val moveText = "${moveMinutes}m moved"
            val streakText = if (streak > 0) "$streak day streak" else ""

            val views = RemoteViews(context.packageName, R.layout.widget_standbreak)
            views.setTextViewText(R.id.widget_timer, breakText)
            views.setTextViewText(R.id.widget_phase, moveText)
            views.setTextViewText(R.id.widget_goal, streakText)

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pi = PendingIntent.getActivity(
                    context, 0, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pi)
            }

            mgr.updateAppWidget(widgetId, views)
        }
    }

    override fun onUpdate(context: Context, mgr: AppWidgetManager, widgetIds: IntArray) {
        for (id in widgetIds) {
            updateWidget(context, mgr, id)
        }
        scheduleNextUpdate(context)
    }

    override fun onEnabled(context: Context) {
        scheduleNextUpdate(context)
    }

    override fun onDisabled(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(getTickPendingIntent(context))
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_TICK) {
            updateAllWidgets(context)
            scheduleNextUpdate(context)
        }
    }

    private fun scheduleNextUpdate(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = getTickPendingIntent(context)
        am.setExactAndAllowWhileIdle(
            AlarmManager.RTC,
            System.currentTimeMillis() + 60_000,
            pi
        )
    }

    private fun getTickPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, StandBreakWidgetProvider::class.java).apply {
            action = ACTION_TICK
        }
        return PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
