import UIKit
import React
import React_RCTAppDelegate

@UIApplicationMain
class AppDelegate: RCTAppDelegate {
  override var moduleName: String! {
    get {
      return "SightaAI"
    }
    set {
      // no-op setter required for mutable property override
    }
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
#if DEBUG
    // Use explicit IPv4 localhost to avoid IPv6 or hostname resolution issues
    return URL(string: "http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&minify=false&inlineSourceMap=true")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
