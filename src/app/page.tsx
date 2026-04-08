import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Root: redirect to /dashboard if session exists, else /kids (kiosk default)
export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("homeapp-session");

  if (session?.value) {
    redirect("/dashboard");
  } else {
    redirect("/kids");
  }
}
