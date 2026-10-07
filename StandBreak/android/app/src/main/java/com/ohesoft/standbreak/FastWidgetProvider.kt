package com.ohesoft.standbreak

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class FastWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val ACTION_TICK = "com.ohesoft.standbreak.WIDGET_TICK"

        private val PHASES = arrayOf(
            Pair(24, "AUTOPHAGY"),
            Pair(20, "KETOSIS"),
            Pair(16, "FAT BURNING"),
            Pair(12, "GLYCOGEN DEPLETION"),
        )

        fun updateAllWidgets(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, FastWidgetProvider::class.java))
            for (id in ids) {
                updateWidget(context, mgr, id)
            }
        }

        private fun updateWidget(context: Context, mgr: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(WidgetDataModule.PREFS, Context.MODE_PRIVATE)
            val lastMeal = prefs.getLong("last_meal_timestamp", 0L).let { if (it == 0L) null else it }
            val goalHours = prefs.getFloat("goal_hours", 16f).toDouble()

            val now = System.currentTimeMillis()
            val elapsed = if (lastMeal != null) now - lastMeal else 0L
            val elapsedMin = (elapsed / 60000).toInt()
            val hours = elapsedMin / 60
            val mins = elapsedMin % 60

            val timerText = "${hours.toString().padStart(2, '0')} h  ${mins.toString().padStart(2, '0')} m"

            val phase = if (elapsed < 60_000) {
                "STARTED"
            } else {
                var label = "FASTING"
                for ((h, l) in PHASES) {
                    if (elapsed >= h * 3600000L) {
                        label = l
                        break
                    }
                }
                label
            }

            val goalText = if (goalHours % 1.0 == 0.0) {
                "Goal ${goalHours.toInt()}h"
            } else {
                val gh = goalHours.toInt()
                val gm = ((goalHours % 1.0) * 60).toInt()
                "Goal ${gh}:${gm.toString().padStart(2, '0')}"
            }

            val views = RemoteViews(context.packageName, R.layout.widget_fast)
            views.setTextViewText(R.id.widget_timer, timerText)
            views.setTextViewText(R.id.widget_phase, phase)
            views.setTextViewText(R.id.widget_goal, goalText)

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
        val intent = Intent(context, FastWidgetProvider::class.java).apply {
            action = ACTION_TICK
        }
        return PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
