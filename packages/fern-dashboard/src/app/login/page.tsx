import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import { redirect } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { EnableNoiseAnimation } from "@/components/EnableNoiseAnimation";
import { LoginPage } from "@/components/login-page/LoginPage";

export default async function Page() {
    const session = await getCurrentSession();

    if (session == null) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <EnableNoiseAnimation />
                <LoginPage />
            </ThemeProvider>
        );
    } else {
        redirect("/");
    }
}
