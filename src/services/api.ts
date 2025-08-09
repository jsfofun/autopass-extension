import type { User } from "@app/api/users";
import { create } from "zustand";

interface AuthClassType {
    init: (user: User) => void;
}

class AuthorizationClass implements AuthClassType {
    token!: string;
    userId!: string;
    channelId!: string;
    clientId!: string;
    helixToken!: string;

    init() {
        // this.token = user.token;
        // this.userId = user.userId;
        // this.channelId = user.channelId;
        // this.clientId = user.clientId;
        // this.helixToken = user.helixToken;
    }
}
export const auth = new AuthorizationClass();
export const is_authorized = create(() => false);
class API {
    baseURL: string;
    authorized: boolean = false;

    constructor(url = "https://localhost:8081") {
        this.baseURL = url;
    }

    async request(url: string, method: string, headers: HeadersInit = {}, body?: BodyInit) {
        if (!is_authorized.getState()) {
            throw new Error("Unauthorized");
        }
        const _url = new URL(url, this.baseURL);
        return fetch(_url, {
            method,
            headers: {
                "Client-ID": auth.clientId,
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${auth.token}`.trim(),
                ...headers,
            },
            body,
        });
    }

    async get(url: string, headers: HeadersInit = {}) {
        return this.request(url, "GET", headers);
    }

    async post(url: string, headers: HeadersInit = {}, body?: BodyInit) {
        return this.request(url, "POST", headers, body);
    }

    async put(url: string, body: BodyInit, headers: HeadersInit = {}) {
        return this.request(url, "PUT", headers, body);
    }

    async delete(url: string, headers: HeadersInit = {}) {
        return this.request(url, "DELETE", headers);
    }
}

const api = new API();

export default api;
