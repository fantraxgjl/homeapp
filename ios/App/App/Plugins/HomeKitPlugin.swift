import Foundation
import Capacitor
import HomeKit

@objc(HomeKitPlugin)
public class HomeKitPlugin: CAPPlugin, HMHomeManagerDelegate {

    private var homeManager: HMHomeManager?

    // MARK: - Authorization

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.homeManager = HMHomeManager()
            self.homeManager?.delegate = self
            // Allow time for the home manager to load data
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
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
        }
        call.resolve(["accessories": result])
    }

    // MARK: - Get Accessory State

    @objc func getAccessoryState(_ call: CAPPluginCall) {
        guard let uid = call.getString("uniqueIdentifier") else {
            call.reject("uniqueIdentifier required"); return
        }
        guard let accessory = findAccessory(uid: uid) else {
            call.reject("Accessory not found: \(uid)"); return
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
                default: break
                }
            }
        }
        call.resolve(state)
    }

    // MARK: - Call Service

    @objc func callService(_ call: CAPPluginCall) {
        guard let uid = call.getString("uniqueIdentifier") else {
            call.reject("uniqueIdentifier required"); return
        }
        guard let accessory = findAccessory(uid: uid) else {
            call.reject("Accessory not found: \(uid)"); return
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
                    if let ls = call.getString("lockState") { targetValue = ls == "unsecured" ? 0 : 1 }
                default: break
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

    // MARK: - HMHomeManagerDelegate

    public func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
        // Enable notifications for all accessories so notifyListeners fires
        for home in manager.homes {
            for accessory in home.accessories {
                for service in accessory.services {
                    for characteristic in service.characteristics {
                        if characteristic.properties.contains(HMCharacteristicPropertySupportsEventNotification) {
                            characteristic.enableNotification(true) { _ in }
                        }
                    }
                }
            }
        }
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
            "category": accessory.category.categoryType,
            "roomName": roomName as Any,
            "isReachable": accessory.isReachable,
        ]
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
