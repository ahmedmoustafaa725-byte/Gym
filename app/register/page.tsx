import { AuthForm } from "@/components/auth/auth-form";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function RegisterPage() {
  return (
    <>
      <MarketingNav />
      <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
        <AuthForm mode="register" />
      </main>
    </>
  );
}
