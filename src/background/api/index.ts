import { UpsertSaveBody, UsersLoginBody } from "@autopass/schemas";
import { Save } from "../../shared/types/saves";
import Hash from "../../shared/utils/hashing";
import { SERVER_PUBLIC_KEY_PEM } from "../key";
import { AES, SERVER_PUBLIC_KEY } from "../utils/aes";

class API {
    #uri: string;
    constructor() {
        this.#uri = "http://localhost:1212/api";
    }

    async xhr(url: string, body?: object, method?: RequestInit["method"]) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === this.DONE) {
                    /** If is unauthorized person then set "logged" to false and delete token from cookies */
                    if (this.status >= 200 && this.status <= 300) resolve(JSON.parse(this.responseText));
                    else reject(JSON.parse(this.responseText));
                    // /** If  request got status errors, return nothing */ else if (this.ok === false) return undefined;
                    /** If  request is ok, return response */
                    console.log(this.getAllResponseHeaders());
                }
            });

            xhr.open(method ?? "GET", `${this.#uri}${url}`);
            xhr.setRequestHeader("Content-Type", "application/json");

            if (body) xhr.send(JSON.stringify(body));
            else xhr.send(null);
        });
    }

    async getRequest(url: string, body?: object, method?: RequestInit["method"]) {
        const req = await fetch(`${this.#uri}${url}`, {
            method: method ?? "GET",
            body: JSON.stringify(body),
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        console.log(req);
        /** If is unauthorized person then set "logged" to false and delete token from cookies */
        if (req.status === 401) return undefined;
        /** If  request got status errors, return nothing */ else if (req.ok === false) return undefined;
        /** If  request is ok, return response */ else return await req.json();
    }

    async UpsertSave(data: UpsertSaveBody) {
        const hashed = await Hash.encrypt("example", JSON.stringify(data));
        const decrypted = await Hash.decrypt("example", hashed);
        console.log(`hashed`, hashed, `parsed`, decrypted);
        return this.xhr("/save", data, "PUT") as Promise<Save>;
    }

    async registerAesKeyWithServer(aesKey: CryptoKey) {
        const aesKeyBase64 = await AES.generatePublicKey(aesKey);
        const key = await AES.encryptAesKeyWithRsa(aesKeyBase64, SERVER_PUBLIC_KEY_PEM);

        return this.xhr("/keys/register", { key }, "PUT");
        // await fetch("https://your-server.com/api/keys/register", {
        //     method: "POST",
        //     body: JSON.stringify({ userId, encryptedAesKey: key }),
        //     headers: { "Content-Type": "application/json" },
        // });
    }
    async Register(body: UsersLoginBody) {
        // 1. Генерация сессионного AES-ключа (для шифрования данных)
        const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

        // 2. Экспорт AES-ключа в base64
        const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);
        const aesKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedAesKey)));

        // 3. Шифрование AES-ключа публичным ключом сервера (RSA-OAEP)
        const encryptedAesKey = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            SERVER_PUBLIC_KEY,
            new TextEncoder().encode(aesKeyBase64),
        );

        // 4. Отправка на сервер
        body.public_key = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));

        // await fetch("https://your-server.com/api/keys/register", {
        //     method: "POST",
        //     body: JSON.stringify({ userId, encryptedAesKey: key }),
        //     headers: { "Content-Type": "application/json" },
        // });
        return this.xhr("/register", body, "POST");
    }
    async Login(body: UsersLoginBody) {
        // 1. Генерация сессионного AES-ключа (для шифрования данных)
        const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

        // 2. Экспорт AES-ключа в base64
        const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);
        const aesKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedAesKey)));

        // 3. Шифрование AES-ключа публичным ключом сервера (RSA-OAEP)
        const encryptedAesKey = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            SERVER_PUBLIC_KEY,
            new TextEncoder().encode(aesKeyBase64),
        );

        // 4. Отправка на сервер
        body.public_key = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));
        return this.xhr("/login", body, "PUT");
    }
}
// "http://localhost:1212/api/user/register"
const api = new API();

export default api;
