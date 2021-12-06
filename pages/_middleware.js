import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    //Token will exist if user is logged in
    const token = await getToken({ req, secret: process.env.JWT_secret });

    const { pathname } = req.nextUrl;

    // Allow the requests if the following is true ... 
    // 1) Its a request for next-aut session & provider fetching
    // 2) the token exists
    if (pathname.includes('/api/auth') || token) {
        return NextResponse.next();
    }

    // 3) Redirect to login if no token & pathname
    // Redirect them to login if they don't have token AND are requesting a protected route
    if (!token && pathname !== '/login') {
        return NextResponse.redirect("/login");
    }
}