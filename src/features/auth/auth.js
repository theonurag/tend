export function createAuthService(client, {
  redirectTo = () => `${window.location.origin}${window.location.pathname}`
} = {}) {
  return {
    async sendMagicLink(email) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo() }
      });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    },

    async initialSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    onSessionChange(callback) {
      return client.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => callback(session), 0);
      });
    }
  };
}
