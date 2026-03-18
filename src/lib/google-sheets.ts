import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 🧾 INTERFACES
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

// 🔐 FIX PRIVATE KEY (Vercel)
const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID || '',
    serviceAccountAuth
);

// 🧠 CACHE DOC
let lastDocLoad = 0;
const DOC_CACHE_TTL = 10000;

export async function loadDoc() {
    const now = Date.now();
    if (now - lastDocLoad < DOC_CACHE_TTL) return;

    await doc.loadInfo();
    lastDocLoad = now;
}

// 🔥 LOGIN REAL
export async function getUserByCredentials(
    username: string,
    password: string
): Promise<UserRow | null> {

    try {
        await loadDoc();

        const sheet = doc.sheetsByTitle['USUARIOS'];
        if (!sheet) throw new Error('Hoja USUARIOS no encontrada');

        const rows = await sheet.getRows();

        const inputUser = username.trim().toLowerCase();
        const inputPass = password.trim();

        const userRow = rows.find(row => {
            const sheetUser = row.get('USER')?.toString().trim().toLowerCase();
            const sheetPass = row.get('CLAVE')?.toString().trim();

            return sheetUser === inputUser && sheetPass === inputPass;
        });

        if (!userRow) return null;

        // 🔐 GENERAR TOKEN
        const newToken =
            Math.random().toString(36).substring(2) +
            Date.now().toString(36);

        userRow.set('SESSION_TOKEN', newToken);
        await userRow.save();

        // 🔥 RETORNAR OBJETO PLANO (SIN .get en auth)
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
// 🔐 VALIDAR TOKEN (NECESARIO PARA SESSION)
export async function checkSessionToken(
    username: string,
    token: string
): Promise<boolean> {

    try {
        await loadDoc();

        const sheet = doc.sheetsByTitle['USUARIOS'];
        if (!sheet) return false;

        const rows = await sheet.getRows();

        const userRow = rows.find(row =>
            row.get('USER')?.toString().trim() === username.trim()
        );

        if (!userRow) return false;

        const currentToken = userRow.get('SESSION_TOKEN');

        return currentToken === token;

    } catch (error) {
        console.error("CHECK TOKEN ERROR:", error);
        return false;
    }
}