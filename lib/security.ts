import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPin(pin:string){const salt=randomBytes(16).toString('hex');const derived=scryptSync(pin,salt,32).toString('hex');return `${salt}:${derived}`;}
export function verifyPin(pin:string,stored:string){const [salt,key]=stored.split(':');const derived=scryptSync(pin,salt,32);const keyBuffer=Buffer.from(key,'hex');return timingSafeEqual(derived,keyBuffer);}
export function isValidPin(pin:string){return /^\d{4}$/.test(pin);}
