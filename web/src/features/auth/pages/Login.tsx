"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
    Wrench,
    Eye,
    EyeOff,
    Mail,
    LockKeyhole,
    Apple,
} from "lucide-react";

export default function LoginPage() {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        alert(`Login demonstrativo para: ${email}`);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4 py-8">
            <section className="w-full max-w-md border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
                <Link
                    href="/"
                    className="mb-2 flex items-center justify-center gap-2"
                >
                    <Wrench className="h-6 w-6 text-orange-500" />
                    <span className="text-2xl font-extrabold text-orange-500">
                        MobiFix
                    </span>
                </Link>

                <p className="mb-7 text-center text-sm text-gray-500">
                    Acesse sua conta para continuar
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            E-mail
                        </label>

                        <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 focus-within:border-orange-400">
                            <Mail className="h-4 w-4 shrink-0 text-gray-400" />

                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className="h-11 w-full bg-transparent text-sm text-gray-800 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="senha"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Senha
                        </label>

                        <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 focus-within:border-orange-400">
                            <LockKeyhole className="h-4 w-4 shrink-0 text-gray-400" />

                            <input
                                id="senha"
                                name="senha"
                                type={mostrarSenha ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(event) => setSenha(event.target.value)}
                                required
                                className="h-11 w-full bg-transparent text-sm text-gray-800 outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setMostrarSenha((atual) => !atual)}
                                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                className="text-gray-400 hover:text-orange-500"
                            >
                                {mostrarSenha ? (
                                    <Eye className="h-5 w-5" />
                                ) : (
                                    <EyeOff className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link
                            href="/recuperar-senha"
                            className="text-sm text-orange-500 hover:underline"
                        >
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                        Entrar
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">OU ENTRE COM</span>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => alert("Login com Google ainda não implementado.")}
                        className="flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50"
                    >
                        <span className="font-bold">G</span>
                        Google
                    </button>

                    <button
                        type="button"
                        onClick={() => alert("Login com Apple ainda não implementado.")}
                        className="flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50"
                    >
                        <Apple className="h-4 w-4" />
                        Apple
                    </button>
                </div>

                <p className="mt-7 text-center text-sm text-gray-500">
                    Não tem uma conta?{" "}
                    <Link
                        href="/cadastro"
                        className="font-semibold text-orange-500 hover:underline"
                    >
                        Criar conta
                    </Link>
                </p>

                <p className="mt-5 text-center text-sm">
                    <Link href="/" className="text-gray-500 hover:text-orange-500">
                        Voltar para a página inicial
                    </Link>
                </p>
            </section>
        </main>
    );
}
