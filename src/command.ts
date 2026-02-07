export interface LoginResult {
  ok: true;
  message: string;
}

/**
 * Local image editing tool. No authentication required.
 */
export async function login(): Promise<LoginResult> {
  return {
    ok: true,
    message: 'No login required for image-editor.',
  };
}
