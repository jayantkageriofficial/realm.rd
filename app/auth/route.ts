export async function GET(request: Request) {
  return Response.json({
    success: true,
    host: request.headers.get("host"),
  });
}
