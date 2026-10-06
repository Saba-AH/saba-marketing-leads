export interface LogoutPort {
  execute(accessToken: string): Promise<void>;
}
