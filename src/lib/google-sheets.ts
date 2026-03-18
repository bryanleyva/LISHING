import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Interfaces
export interface UserRow {
    DNI: string;
    'NOMBRES COMPLETOS': string;
    USER: string;
    CLAVE: string;
    ROL: 'ADMIN' | 'SPECIAL' | 'STANDAR';
    CARGO?: string;
    SUPERVISOR?: string;
    TELEFONO: string;
    SESSION_TOKEN?: string;
    FOTO?: string;
}

export interface BaseRow {
    [key: string]: any;
}

// 🔐 FIX PRIVATE KEY (IMPORTANTE PARA VERCEL)
const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
    ],
});

export const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID || '',
    serviceAccountAuth
);

// Cache doc
let lastDocLoad = 0;
const DOC_CACHE_TTL = 10000;

export async function loadDoc() {
    const now = Date.now();
    if (now - lastDocLoad < DOC_CACHE_TTL) return;

    let retries = 3;
    while (retries > 0) {
        try {
            await doc.loadInfo();
            lastDocLoad = Date.now();
            return;
        } catch (e) {
            retries--;
            console.warn(`loadDoc failed, retries left: ${retries}`, e);
            if (retries === 0) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// 👇 CACHE
import { UserCache } from './user-cache';

// 🔥 LOGIN FINAL
export async function getUserByCredentials(
    username: string,
    password: string
): Promise<UserRow | null> {

    try {
        console.log("LOGIN TRY:", { username, password });

        const cache = UserCache.getInstance();
        await cache.ensureInitialized();

        await loadDoc();

        const sheet = doc.sheetsByTitle['USUARIOS'];
        if (!sheet) throw new Error('Hoja USUARIOS no encontrada');

        const rows = await sheet.getRows();

        // 🔍 NORMALIZACIÓN
        const inputUser = username.trim().toLowerCase();
        const inputPass = password.trim();

        // 🔥 BUSQUEDA ROBUSTA
        const userRow = rows.find(row => {
            const sheetUser = row.get('USER')?.toString().trim().toLowerCase();
            const sheetPass = row.get('CLAVE')?.toString().trim();

            return sheetUser === inputUser && sheetPass === inputPass;
        });

        console.log("USER FOUND:", userRow ? "YES" : "NO");

        if (!userRow) return null;

        // 🔐 TOKEN
        const newToken =
            Math.random().toString(36).substring(2) +
            Date.now().toString(36);

        userRow.set('SESSION_TOKEN', newToken);
        await userRow.save();

        await cache.refresh();

        return {
            DNI: userRow.get('DNI'),
            'NOMBRES COMPLETOS': userRow.get('NOMBRES COMPLETOS'),
            USER: userRow.get('USER'),
            CLAVE: userRow.get('CLAVE'),
            ROL: userRow.get('ROL') as any,
            CARGO: userRow.get('CARGO'),
            SUPERVISOR: userRow.get('SUPERVISOR'),
            TELEFONO: userRow.get('TELEFONO'),
            SESSION_TOKEN: newToken,
            FOTO: userRow.get('FOTO'),
        };

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return null;
    }
}

// 🔐 VALIDAR TOKEN
export async function checkSessionToken(
    username: string,
    token: string
): Promise<boolean> {
    const cache = UserCache.getInstance();
    await cache.ensureInitialized();

    const userRow = cache.findUser(username);
    if (!userRow) return false;

    const currentToken = userRow.get('SESSION_TOKEN');
    return currentToken === token;
}

// 📊 BASE DISPONIBLE
export async function getAvailableBase(limit: number = 10, assignedUser: string) {
    await loadDoc();

    const sheet = doc.sheetsByTitle['BASE'];
    if (!sheet) throw new Error('Hoja BASE no encontrada');

    const rows = await sheet.getRows();

    const availableRows = rows.filter(row =>
        !row.get('ASIGNADO') || row.get('ASIGNADO') === ''
    );

    const assignedData: any[] = [];

    for (let i = 0; i < Math.min(limit, availableRows.length); i++) {
        const row = availableRows[i];

        row.set('ASIGNADO', assignedUser);
        await row.save();

        assignedData.push(row.toObject());
    }

    return assignedData;
}

// 📊 DATA ASIGNADA
export async function getAssignedData(user: string) {
    await loadDoc();

    const sheet = doc.sheetsByTitle['BASE'];
    if (!sheet) return [];

    const rows = await sheet.getRows();

    const userRows = rows.filter(row =>
        row.get('ASIGNADO')?.toString().trim() === user.trim()
    );

    return userRows.map(row => row.toObject());
}