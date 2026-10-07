package com.ohesoft.standbreak

import android.app.Activity
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule

@ReactModule(name = BillingModule.NAME)
class BillingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

    private var billingClient: BillingClient? = null
    private var purchasePromise: Promise? = null

    override fun getName(): String = NAME

    @ReactMethod
    fun initConnection(promise: Promise) {
        val client = BillingClient.newBuilder(reactApplicationContext)
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build()
        billingClient = client
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    promise.resolve(true)
                } else {
                    promise.reject("BILLING_ERROR", "Setup failed: ${result.debugMessage}")
                }
            }
            override fun onBillingServiceDisconnected() {}
        })
    }

    @ReactMethod
    fun purchasePro(promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("NOT_READY", "Billing client not ready")
            return
        }
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity")
            return
        }
        purchasePromise = promise

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(SKU)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                )
            )
            .build()

        client.queryProductDetailsAsync(params, object : ProductDetailsResponseListener {
            override fun onProductDetailsResponse(billingResult: BillingResult, result: QueryProductDetailsResult) {
                val productDetailsList = result.productDetailsList
                if (billingResult.responseCode != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                    purchasePromise?.reject("PRODUCT_ERROR", "Product not found: ${billingResult.debugMessage}")
                    purchasePromise = null
                    return
                }

                val productDetails = productDetailsList[0]
                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(
                        listOf(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .build()
                        )
                    )
                    .build()
                client.launchBillingFlow(activity, flowParams)
            }
        })
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                    acknowledgePurchase(purchase)
                    purchasePromise?.resolve(true)
                    purchasePromise = null
                    sendEvent("purchaseCompleted", null)
                    return
                }
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            purchasePromise?.resolve(false)
            purchasePromise = null
        } else {
            purchasePromise?.reject("PURCHASE_ERROR", billingResult.debugMessage)
            purchasePromise = null
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        if (!purchase.isAcknowledged) {
            val params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()
            billingClient?.acknowledgePurchase(params) {}
        }
    }

    @ReactMethod
    fun restorePurchases(promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.resolve(false)
            return
        }
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()
        client.queryPurchasesAsync(params) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                for (purchase in purchasesList) {
                    if (purchase.products.contains(SKU) &&
                        purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        promise.resolve(true)
                        return@queryPurchasesAsync
                    }
                }
            }
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun endConnection(promise: Promise) {
        billingClient?.endConnection()
        billingClient = null
        promise.resolve(true)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    companion object {
        const val NAME = "BillingModule"
        private const val SKU = "pro_lifetime"
    }
}
