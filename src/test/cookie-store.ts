type CookieRecord = {
    name: string;
    value: string;
};

class TestCookieStore {
    private cookieMap = new Map<string, string>();

    get(name: string): CookieRecord | undefined {
        const value = this.cookieMap.get(name);
        if (!value) {
            return undefined;
        }

        return { name, value };
    }

    set(name: string, value: string) {
        this.cookieMap.set(name, value);
    }

    delete(name: string) {
        this.cookieMap.delete(name);
    }

    clear() {
        this.cookieMap.clear();
    }
}

const store = new TestCookieStore();

export function getTestCookieStore() {
    return store;
}

export function setTestCookie(name: string, value: string) {
    store.set(name, value);
}

export function clearTestCookies() {
    store.clear();
}
