import { redirect } from "next/navigation";

/** Legacy index — canonical list is /discover#collections. */
export default function CollectionsIndexRedirect() {
  redirect("/discover");
}
