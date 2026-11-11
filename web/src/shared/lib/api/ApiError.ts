/**
 * Erro devolvido pela API MobiFix (ou gerado pelo cliente HTTP quando a API não responde).
 * Fica em arquivo próprio, sem dependências, para poder ser usado em utilitários testáveis;
 * `http.ts` continua exportando esta classe, então os imports existentes não mudam.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: { field: string; message: string }[];

  constructor(status: number, message: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
