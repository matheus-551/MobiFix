import { errorResponse, getVerificationService, noStore, readJson } from "@/server/emailVerification/runtime";

/** POST /api/email-verification/account  { email, token, password, displayName } → cria a conta já verificada. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const result = await getVerificationService().createVerifiedAccount({
      email: body.email,
      token: body.token,
      password: body.password,
      displayName: body.displayName,
    });
    return Response.json(result, { status: 201, headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}
