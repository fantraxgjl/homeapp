import { Card } from "@/components/ui/Card";
import { ShoppingList } from "@/components/meals/ShoppingList";

export default function ShoppingPage() {
  return (
    <div className="p-4">
      <Card variant="elevated">
        <h1 className="text-white font-bold text-lg mb-4">🛒 Shopping List</h1>
        <ShoppingList />
      </Card>
    </div>
  );
}
