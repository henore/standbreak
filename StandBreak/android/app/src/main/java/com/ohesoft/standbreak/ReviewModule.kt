package com.ohesoft.standbreak

import android.app.Activity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.google.android.play.core.review.ReviewManagerFactory

class ReviewModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ReviewModule"

    @ReactMethod
    fun requestReview(promise: Promise) {
        val activity = getCurrentActivity() as? Activity
        if (activity == null) {
            promise.resolve(false)
            return
        }
        val manager = ReviewManagerFactory.create(activity)
        manager.requestReviewFlow().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                manager.launchReviewFlow(activity, task.result).addOnCompleteListener {
                    promise.resolve(true)
                }
            } else {
                promise.resolve(false)
            }
        }
    }
}
