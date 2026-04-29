import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { callbackUrl, error } = await searchParams;

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const cb = (formData.get("callbackUrl") as string) || "/";
    await signIn("credentials", {
      email,
      password,
      redirectTo: cb,
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-display-l text-foreground">내 자산</h1>
        <p className="text-body-m text-muted-foreground">
          개인용 자산 관리 가계부
        </p>
      </div>

      <Card className="w-full p-6">
        <form action={handleSignIn} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
          {error ? (
            <p className="text-body-s text-danger">
              로그인할 수 없어요. 이메일/비밀번호를 확인해 주세요.
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            로그인
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-caption text-muted-foreground">
        1인 사용자용 — 회원가입은 시드 스크립트로 진행해요.
      </p>
    </div>
  );
}
