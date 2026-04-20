/**
 * CaptureRestrictModule — Objective-C bridge header
 *
 * React Native requires an ObjC bridge to discover Swift native modules.
 * This file exposes the Swift CaptureRestrictModule class to the RN runtime.
 *
 * The method signatures here must match the @objc methods in
 * CaptureRestrictModule.swift exactly.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CaptureRestrictModule, RCTEventEmitter)

RCT_EXTERN_METHOD(enableSecureMode:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disableSecureMode:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
