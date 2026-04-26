export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertVercelDeployEnv } = await import("@/lib/env/deploy-check")
    assertVercelDeployEnv()
  }
}
