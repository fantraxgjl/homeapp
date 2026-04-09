import Foundation
import Capacitor
import HomeKit

// MARK: - HomeKitPlugin

/// Capacitor plugin that bridges HomeKit.framework to the web layer.
///
/// Registration in AppDelegate is automatic via `@objc(HomeKitPlugin)`.
/// The JavaScript side uses `registerPlugin("HomeKitPlugin")` in
/// src/lib/native/homekit.ts.
@objc(HomeKitPlugin)
public class HomeKitPlugin: CAPPlugin, HMHomeManagerDelegate {

    private var homeManager: HMHomeManager?
    private var stateListeners: [String: CAPPluginCall] = [:]

    // MARK: - Authorization

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.homeManager = HMHomeManager()
            self.homeManager?.delegate = self

            // HMHomeManager triggers homeManagerDidUpdateHomes when ready.
            // We resolve after a short delay to allow the framework to
            // initialise; in production use the delegate callback.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                call.resolve(["granted": true])
            }
        }
    }

    // MARK: - Fetch Accessories

    @objc func fetchAccessories(_ call: CAPPluginCall) {
        guard let manager = homeManager else {
            call.reject("HomeKit not initialised. Call requestAuthorization first.")
            return
        }

        var result: [[String: Any]] = []

        for home in manager.homes {
            for room in home.rooms {
                for accessory in room.accessories {
                    result.append(accessoryDict(accessory, roomName: room.name))
                }
            }
            // Include accessories not assigned to a room
            for accessory in home.accessories where home.rooms.allSatisfy({ !$0.accessories.contains(accessory) }) {
                result.append(accessoryDict(accessory, roomName: nil))
            }
        }

        call.resolve(["accessories": result])
    }

    // MARK: - Get Accessory State

    @objc func getAccessoryState(_ call: CAPPluginCall) {
        guard let uid = call.getString("uniqueIdentifier") else {
            call.reject("uniqueIdentifier required")
            return
        }
        guard let accessory = findAccessory(uid: uid) else {
            call.reject("Accessory not found: \(uid)")
            return
        }

        var state: [String: Any] = ["uniqueIdentifier": uid]

        for service in accessory.services {
            for characteristic in service.characteristics {
                switch characteristic.characteristicType {
                case HMCharacteristicTypePowerState:
                    state["on"] = characteristic.value as? Bool
                case HMCharacteristicTypeBrightness:
                    state["brightness"] = characteristic.value as? Int
                case HMCharacteristicTypeCurrentTemperature:
                    state["currentTemperature"] = characteristic.value as? Double
                case HMCharacteristicTypeTargetTemperature:
                    state["targetTemperature"] = characteristic.value as? Double
                case HMCharacteristicTypeLockMechanismCurrentState:
                    if let v = characteristic.value as? Int {
                        state["lockState"] = lockStateString(v)
                    }
                default:
                    break
                }
            }
        }

        call.resolve(state)
    }

    // MARK: - Call Service (write characteristics)

    @objc func callService(_ call: CAPPluginCall) {
        guard let uid = call.getString("uniqueIdentifier") else {
            call.reject("uniqueIdentifier required")
            return
        }
        guard let accessory = findAccessory(uid: uid) else {
            call.reject("Accessory not found: \(uid)")
            return
        }

        let group = DispatchGroup()
        var writeError: Error?

        for service in accessory.services {
            for characteristic in service.characteristics {
                var targetValue: Any?

                switch characteristic.characteristicType {
                case HMCharacteristicTypePowerState:
                    if let on = call.getBool("on") { targetValue = on }
                case HMCharacteristicTypeBrightness:
                    if let b = call.getInt("brightness") { targetValue = b }
                case HMCharacteristicTypeTargetTemperature:
                    if let t = call.getDouble("targetTemperature") { targetValue = t }
                case HMCharacteristicTypeLockMechanismTargetState:
                    if let ls = call.getString("lockState") {
                        targetValue = ls == "unsecured" ? 0 : 1
                    }
                default:
                    break
                }

                guard let value = targetValue else { continue }

                group.enter()
                characteristic.writeValue(value) { error in
                    if let e = error { writeError = e }
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) {
            if let error = writeError {
                call.reject(error.localizedDescription)
            } else {
                call.resolve(["success": true])
            }
        }
    }

    // MARK: - Real-time listener

    @objc func addListener(_ call: CAPPluginCall) {
        call.keepAlive = true
        stateListeners[call.callbackId] = call

        // Subscribe to characteristic updates for all accessories
        homeManager?.homes.forEach { home in
            home.accessories.forEach { accessory in
                accessory.services.forEach { service in
                    service.characteristics.forEach { characteristic in
                        if characteristic.properties.contains(HMCharacteristicPropertySupportsEventNotification) {
                            characteristic.enableNotification(true) { _ in }
                        }
                    }
                }
                accessory.delegate = self as? HMAccessoryDelegate
            }
        }
    }

    // MARK: - HMHomeManagerDelegate

    public func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
        // Called when home data changes — re-enable notifications for new accessories
    }

    // MARK: - Helpers

    private func findAccessory(uid: String) -> HMAccessory? {
        homeManager?.homes.flatMap(\.accessories).first {
            $0.uniqueIdentifier.uuidString == uid
        }
    }

    private func accessoryDict(_ accessory: HMAccessory, roomName: String?) -> [String: Any] {
        [
            "uniqueIdentifier": accessory.uniqueIdentifier.uuidString,
            "name": accessory.name,
            "category": categoryString(accessory.category.categoryType),
            "roomName": roomName as Any,
            "isReachable": accessory.isReachable,
        ]
    }

    private func categoryString(_ type: HMAccessoryCategoryType) -> String {
        switch type {
        case .lightbulb: return "lightbulb"
        case .switch: return "switch"
        case .thermostat: return "thermostat"
        case .doorLock: return "lock"
        case .sensor: return "sensor"
        default: return "other"
        }
    }

    private func lockStateString(_ value: Int) -> String {
        switch value {
        case 0: return "unsecured"
        case 1: return "secured"
        case 2: return "jammed"
        default: return "unknown"
        }
    }
}
