import SwiftUI

/// Shown on first launch (or when no server URL is stored) so the user can
/// enter the address of their dashboard server — either the local Pi URL
/// (e.g. http://homepi.local:3000) or a cloud host (e.g. https://xxx.railway.app).
struct ServerSetupView: View {
    @State private var urlText: String = ""
    @State private var validationError: String? = nil
    @State private var isLoading: Bool = false
    var onConfirm: (String) -> Void

    var body: some View {
        ZStack {
            Color(red: 0.059, green: 0.090, blue: 0.161)  // slate-900
                .ignoresSafeArea()

            VStack(spacing: 32) {
                // Icon
                Text("🏠")
                    .font(.system(size: 64))

                // Title
                VStack(spacing: 8) {
                    Text("Family Dashboard")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                    Text("Enter the address of your dashboard server")
                        .font(.system(size: 15))
                        .foregroundColor(Color(white: 0.6))
                        .multilineTextAlignment(.center)
                }

                // URL field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Server URL")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(white: 0.6))

                    TextField("http://homepi.local:3000", text: $urlText)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .keyboardType(.URL)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Color(white: 0.15))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                        .font(.system(size: 16, design: .monospaced))

                    if let error = validationError {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 0.95, green: 0.35, blue: 0.35))
                    }
                }
                .padding(.horizontal, 32)

                // Examples
                VStack(alignment: .leading, spacing: 6) {
                    Text("Examples:")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color(white: 0.45))
                    ExampleRow(text: "http://192.168.1.100:3000", label: "Raspberry Pi (LAN IP)")
                    ExampleRow(text: "http://homepi.local:3000", label: "Raspberry Pi (hostname)")
                    ExampleRow(text: "https://xxx.railway.app", label: "Railway / cloud host")
                }
                .padding(.horizontal, 32)

                // Connect button
                Button(action: validate) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.85)
                        }
                        Text(isLoading ? "Connecting…" : "Connect")
                            .font(.system(size: 17, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(red: 0.38, green: 0.40, blue: 0.95))
                    .cornerRadius(14)
                    .foregroundColor(.white)
                }
                .disabled(urlText.isEmpty || isLoading)
                .padding(.horizontal, 32)
            }
            .padding(.vertical, 48)
        }
    }

    private func validate() {
        validationError = nil
        var raw = urlText.trimmingCharacters(in: .whitespacesAndNewlines)
        // Prepend http:// if no scheme provided
        if !raw.hasPrefix("http://") && !raw.hasPrefix("https://") {
            raw = "http://" + raw
            urlText = raw
        }
        guard let url = URL(string: raw), url.host != nil else {
            validationError = "Enter a valid URL including hostname."
            return
        }
        isLoading = true
        // Quick reachability check
        var request = URLRequest(url: url.appendingPathComponent("/api/pin/status"))
        request.timeoutInterval = 6
        URLSession.shared.dataTask(with: request) { _, response, error in
            DispatchQueue.main.async {
                isLoading = false
                if let http = response as? HTTPURLResponse, http.statusCode < 500 {
                    onConfirm(raw)
                } else {
                    validationError = error?.localizedDescription
                        ?? "Could not reach the server. Check the URL and try again."
                }
            }
        }.resume()
    }
}

private struct ExampleRow: View {
    let text: String
    let label: String
    var body: some View {
        HStack(spacing: 8) {
            Text(text)
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(Color(red: 0.6, green: 0.65, blue: 1.0))
            Text("— \(label)")
                .font(.system(size: 12))
                .foregroundColor(Color(white: 0.45))
        }
    }
}
