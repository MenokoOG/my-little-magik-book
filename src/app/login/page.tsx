import { LoginForm } from "@/components/login-form";
import { PageShell } from "@/components/page-shell";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const signupSuccess = params.signup === "success";
  const initialEmail = typeof params.email === "string" ? params.email : "";

  const nextPathRaw = typeof params.next === "string" ? params.next : "/home";
  const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/home";

  return (
    <div className="space-y-6">
      <PageShell
        title="Log in"
        description="Sign in to manage your decks and friends."
      />
      {signupSuccess ? (
        <p className="max-w-md rounded border px-3 py-2 text-sm">
          Signup successful. You can now log in.
        </p>
      ) : null}
      <LoginForm initialEmail={initialEmail} nextPath={nextPath} />
    </div>
  );
}
