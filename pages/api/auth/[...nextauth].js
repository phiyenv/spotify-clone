import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import spotifyApi from "../../../lib/spotify";
import spotifyApin, { LOGIN_URL } from "../../../lib/spotify";

async function refreshAcessToken(token){
    try {
        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);

        const {body: refreshedToken} = await spotifyApi.refreshAcessToken();
        console.log("REFRESHED TOKEN IS", refreshedToken);

        return {
            ...token,
            accessToken: refreshedToken.access_token,
            accessTokenExpires: Date.now + refreshedToken.expires_in * 1000, // = 1h as 3600 return from spotify API
            refreshToken: refreshedToken.refresh_token ?? token.reefreshToken,
            // Replace if new one came back else fall back to old refresh token
        }
        
    } catch (error) {
        console.log()
        
        return {
            ...token,
            error:"RefreshAccessTokenError",
        };
    }
}

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        SpotifyProvider({
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
            authentication: LOGIN_URL,

        }),
        // ...add more providers here
    ],
    secret: process.env.JWT_SECRET,
    pages: {
        signIn: '/login'
    },
    callbacks: {
        async jwt({ token, account, user }) {
            // Persist the OAuth access_token to the token right after signin
            if (account && user) {
                return {
                    ...token,
                    AccessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    username: account.providerAccountId,
                    accessTokenExpires: account.expires_at * 1000
                    // We are handling expiry times in Millisecondes hence * 1000
                };

            }

            // Return previous token if the access token has no eexpired yet
            if (Date.now() < token.accessTokenExpires) {
                console.log("EXISTING ACCESS TOKEN IS VALID");
                return token;
            }

            // Access token has expired, so we need to refresh it...
            console.log("ACCESS TOKEN HAS EXPIRED, REFRESHING...");
            return await refreshAcessToken(token);
        },

        async session ({session, token}){
            session.user.accessToken = token.accessToken;
            session.user.refreshToken = token.refreshToken;
            session.user.username = token.username;

            return session;
        }
    },
})