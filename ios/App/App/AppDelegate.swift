import UIKit
import Capacitor
import SwiftUI

/// Server URL is persisted in UserDefaults under this key.
private let kServerURL = "homeapp_server_url"

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        let window = UIWindow(frame: UIScreen.main.bounds)
        self.window = window

        if let serverURL = UserDefaults.standard.string(forKey: kServerURL), !serverURL.isEmpty {
            // Server URL already configured — launch Capacitor pointing at it.
            launchCapacitor(serverURL: serverURL, in: window)
        } else {
            // First launch — show the setup screen.
            launchSetupScreen(in: window)
        }

        window.makeKeyAndVisible()
        return true
    }

    // MARK: - Private

    private func launchCapacitor(serverURL: String, in window: UIWindow) {
        // Override the Capacitor server URL at runtime.
        // This lets us ship one binary that works with any server address.
        let bridge = CAPBridgeViewController()
        if let url = URL(string: serverURL) {
            bridge.setServerBasePath(url.absoluteString)
        }
        window.rootViewController = bridge
    }

    private func launchSetupScreen(in window: UIWindow) {
        let setupView = ServerSetupView { [weak self] confirmedURL in
            UserDefaults.standard.set(confirmedURL, forKey: kServerURL)
            guard let self, let win = self.window else { return }
            // Transition to the app once the URL is confirmed.
            UIView.transition(with: win, duration: 0.35, options: .transitionCrossDissolve) {
                self.launchCapacitor(serverURL: confirmedURL, in: win)
            }
        }
        window.rootViewController = UIHostingController(rootView: setupView)
    }

    // MARK: - URL handling (deep links)

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIOpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            application, continue: userActivity, restorationHandler: restorationHandler
        )
    }
}
