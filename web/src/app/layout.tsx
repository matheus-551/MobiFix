import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "MobiFix",
    description: "Aplicativo MobiFix para serviços e assistência.",
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({
    children,
}: RootLayoutProps) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}