import { getApps, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from './env';
const adminApp=getApps().length?getApps()[0]:initializeApp({credential:cert({projectId:env.admin.projectId,clientEmail:env.admin.clientEmail,privateKey:env.admin.privateKey})});
export const adminAuth=getAuth(adminApp);export const adminDb=getFirestore(adminApp);
