
/**
 * Gera CPF e CNPJ aleatórios com dígitos verificadores válidos.
 * Uso exclusivo para testes e desenvolvimento.
 */

function gerarCPF() {
    const numeros = Array.from(
        { length: 9 },
        () => Math.floor(Math.random() * 10)
    );

    for (let peso = 10; peso >= 2; peso--) {
        // Primeiro dígito verificador
    }

    const calcularDigito = (digitos, pesoInicial) => {
        const soma = digitos.reduce(
            (total, numero, indice) =>
                total + numero * (pesoInicial - indice),
            0
        );

        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    numeros.push(calcularDigito(numeros, 10));
    numeros.push(calcularDigito(numeros, 11));

    // Evita sequências como 111.111.111-11
    if (numeros.every((n) => n === numeros[0])) {
        return gerarCPF();
    }

    return numeros.join("");
}

function gerarCNPJ() {
    const numeros = Array.from(
        { length: 8 },
        () => Math.floor(Math.random() * 10)
    );

    // Completa com quatro dígitos aleatórios da filial/ordem.
    numeros.push(0, 0, 0, 1);

    const calcularDigito = (digitos) => {
        const pesos = digitos.length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        const soma = digitos.reduce(
            (total, numero, indice) =>
                total + numero * pesos[indice],
            0
        );

        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    numeros.push(calcularDigito(numeros));
    numeros.push(calcularDigito(numeros));

    if (numeros.every((n) => n === numeros[0])) {
        return gerarCNPJ();
    }

    return numeros.join("");
}

// Exemplos de uso
console.log("CPF:", gerarCPF());
console.log("CNPJ:", gerarCNPJ());

// Para gerar formatados:
function formatarCPF(cpf) {
    return cpf.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        "$1.$2.$3-$4"
    );
}

function formatarCNPJ(cnpj) {
    return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
    );
}

console.log("CPF formatado:", formatarCPF(gerarCPF()));
console.log("CNPJ formatado:", formatarCNPJ(gerarCNPJ()));