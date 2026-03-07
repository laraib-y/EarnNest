import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyParentFromRequest } from '@/lib/auth';
import { serializeTimestamp } from '@/lib/utils';
async function getFamilyId(uid:string){const parentSnap=await adminDb.collection('parents').doc(uid).get();const familyId=parentSnap.data()?.familyId;if(!familyId) throw new Error('Parent account is not initialized');return familyId as string;}
export async function GET(request:Request){try{const decoded=await verifyParentFromRequest(request);const familyId=await getFamilyId(decoded.uid);const snapshot=await adminDb.collection('families').doc(familyId).collection('completions').where('status','==','pending').orderBy('completedAt','desc').get();const completions=snapshot.docs.map(doc=>{const data=doc.data();return {id:doc.id,...data,completedAt:serializeTimestamp(data.completedAt),reviewedAt:serializeTimestamp(data.reviewedAt)};});return NextResponse.json({completions});}catch(error){const message=error instanceof Error?error.message:'Failed to fetch pending chores';return NextResponse.json({error:message},{status:401});}}
