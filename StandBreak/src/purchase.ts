import {NativeModules, NativeEventEmitter} from 'react-native';

const {BillingModule} = NativeModules;

let emitter: NativeEventEmitter | null = null;

export async function initIAP(): Promise<void> {
  await BillingModule.initConnection();
}

export async function endIAP(): Promise<void> {
  if (emitter) {
    emitter.removeAllListeners('purchaseCompleted');
    emitter = null;
  }
  await BillingModule.endConnection();
}

export async function buyPro(): Promise<boolean> {
  return await BillingModule.purchasePro();
}

export function listenToPurchases(onPurchase: () => void): void {
  emitter = new NativeEventEmitter(BillingModule);
  emitter.addListener('purchaseCompleted', onPurchase);
}
