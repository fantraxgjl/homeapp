import { DeviceGrid } from "@/components/home-controls/DeviceGrid";

export default function HomeControlsPage() {
  return (
    <div className="p-4">
      <h1 className="text-white font-bold text-lg mb-4">🏠 Smart Home</h1>
      <DeviceGrid />
    </div>
  );
}
