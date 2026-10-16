export default function Login() {
    return (
        <main>
            <h1>Login MobiFix</h1>

            <form>
                <input
                    type="email"
                    placeholder="Seu e-mail"
                    required
                />

                <input
                    type="password"
                    placeholder="Sua senha"
                    required
                />

                <button type="submit">Entrar</button>
            </form>
        </main>
    );
}