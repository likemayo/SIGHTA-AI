package com.facebook.react

import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage

/**
 * Simplified autolink replacement until the gradle plugin generates PackageList again.
 */
class PackageList(private val reactNativeHost: ReactNativeHost) {

  private val application
    get() = reactNativeHost.application

  val packages: List<ReactPackage>
    get() = listOf(
      MainReactPackage(),
      AsyncStoragePackage(),
    )
}
