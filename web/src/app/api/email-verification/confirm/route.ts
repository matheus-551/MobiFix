import { clientIp, errorResponse, getVerificationService, noStore, readJson } from "@/server/emailVerification/runtime";

/** POST /api/email-verification/confirm  { email, code } → { token } de uso único. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const result = await getVerificationService().confirmCode(body.email, body.code, clientIp(request));
    return Response.json(result, { headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}
