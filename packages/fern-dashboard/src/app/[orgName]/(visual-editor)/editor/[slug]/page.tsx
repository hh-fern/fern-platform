import { redirect } from "next/navigation";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";

export default async function Page() {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  return <p>Hello</p>;
}
