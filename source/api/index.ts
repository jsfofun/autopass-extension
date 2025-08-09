type UpsertSaveBody = {
    website: string;
    hash_data: string;
    fields: {
        [x: string]: string;
    };
};
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
        return this.xhr("/save", data, "PUT") as Promise<{
            id: string;
            user_id: string;
            website: string;
            login_hash: string;
            password_hash: string;
        }>;
    }
}
// "http://localhost:1212/api/user/register"
const api = new API();

export default api;
