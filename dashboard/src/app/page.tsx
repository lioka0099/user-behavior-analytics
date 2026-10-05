import { redirect } from "next/navigation";

/**
 * Entry point: the dashboard is app-scoped, so start at the apps list.
 * `/apps` is protected and sends signed-out visitors to `/login`.
 */
export default function Home() {
  redirect("/apps");
}
