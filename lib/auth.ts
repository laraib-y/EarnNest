import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { adminAuth } from './firebase-admin';
import { env } from './env';
const encoder=new TextEncoder();const secret=encoder.encode(env.childSessionSecret);const CHILD_COOKIE='earnnest_child_session';
export async function verifyParentFromRequest(request:Request){const authHeader=request.headers.get('authorization');if(!authHeader?.startsWith('Bearer ')) throw new Error('Missing Authorization header');return adminAuth.verifyIdToken(authHeader.replace('Bearer ',''));}
export async function createChildSession(payload:{childId:string;familyId:string}){return new SignJWT(payload).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret);}
export async function readChildSession(){const cookieStore=await cookies();const token=cookieStore.get(CHILD_COOKIE)?.value;if(!token) return null;try{const result=await jwtVerify(token,secret);return result.payload as {childId:string;familyId:string};}catch{return null;}}
export async function setChildSessionCookie(token:string){const cookieStore=await cookies();cookieStore.set(CHILD_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*7});}
