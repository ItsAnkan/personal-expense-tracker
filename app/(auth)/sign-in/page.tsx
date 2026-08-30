import { SignInForm } from "@/app/(auth)/sign-in/sign-in-form";

interface SignInPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const createdParam = typeof params.created === "string" ? params.created : Array.isArray(params.created) ? params.created[0] : undefined;

  return <SignInForm created={createdParam === "1"} />;
}
