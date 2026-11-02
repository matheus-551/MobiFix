import { clientIp, errorResponse, getVerificationService, noStore, readJson } from "@/server/emailVerification/runtime";

/** POST /api/email-verification/request  { email } → envia o código de verificação. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const result = await getVerificationService().requestCode(body.email, clientIp(request));
    return Response.json(result, { headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}
