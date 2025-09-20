type QueryKey = [string, unknown?];

type QueryStatus = "idle" | "loading" | "success" | "error";

interface CacheEntry<T = unknown> {
	status: QueryStatus;
	data?: T;
	error?: unknown;
	updatedAt: number;
	staleSeconds: number;
	promise?: Promise<T>;
	subscribers: Set<() => void>;
	fetch?: () => Promise<T>;
}

export interface QueryClientOptions {
	defaultStaleSeconds?: number;
}

export interface FetchQueryOptions<T> {
	key: QueryKey;
	fetch: () => Promise<T>;
	enabled?: boolean;
	staleSeconds?: number;
}

function isArrayTable(value: unknown): value is Array<unknown> {
	if (!typeIs(value, "table")) return false;
	for (const [k] of pairs(value as unknown as Record<string, unknown>)) {
		if (typeOf(k as defined) !== "number") return false;
	}
	return true;
}

function stableSerialize(value: unknown): string {
	const t = typeOf(value as defined);
	if (value === undefined) return "u";
	if (t === "nil") return "n";
	if (t === "boolean") return (value as boolean) ? "b1" : "b0";
	if (t === "number") return `num:${value as number}`;
	if (t === "string") return `str:${value as string}`;
	if (t === "Vector2") {
		const v = value as Vector2;
		return `v2:${v.X},${v.Y}`;
	}
	if (t === "Vector3") {
		const v = value as Vector3;
		return `v3:${v.X},${v.Y},${v.Z}`;
	}
	if (t === "UDim") {
		const v = value as UDim;
		return `ud:${v.Scale},${v.Offset}`;
	}
	if (t === "UDim2") {
		const v = value as UDim2;
		return `ud2:${v.X.Scale},${v.X.Offset},${v.Y.Scale},${v.Y.Offset}`;
	}
	if (t === "Color3") {
		const v = value as Color3;
		return `c3:${v.R},${v.G},${v.B}`;
	}
	if (t === "CFrame") {
		const [rx, ry, rz] = (value as CFrame).ToOrientation();
		return `cf:${rx},${ry},${rz}`;
	}
	if (typeIs(value, "table")) {
		const arr = isArrayTable(value) ? (value as Array<unknown>) : undefined;
		if (arr) {
			const parts = new Array<string>();
			for (const v of arr) parts.push(stableSerialize(v));
			return `arr:[${parts.join(",")}]`;
		}
		const obj = value as Record<string, unknown>;
		const keys = (() => {
			const list = new Array<string>();
			for (const [k] of pairs(obj as Record<string, unknown>)) list.push(k as string);
			list.sort();
			return list;
		})();
		const kv: string[] = [];
		for (const k of keys) kv.push(`${k}:${stableSerialize(obj[k])}`);
		return `obj:{${kv.join(",")}}`;
	}
	return `unk:${t}`;
}

export class QueryClient {
	private cache = new Map<string, CacheEntry<any>>();
	private pathIndex = new Map<string, Set<string>>();
	private defaultStaleSeconds: number;

	constructor(options: QueryClientOptions = {}) {
		this.defaultStaleSeconds = options.defaultStaleSeconds ?? 5;
	}

	public keyToString(key: QueryKey): string {
		const [path, input] = key;
		if (input === undefined) return path;
		return `${path}|${stableSerialize(input)}`;
	}

	private ensureEntry<T>(keyStr: string): CacheEntry<T> {
		let entry = this.cache.get(keyStr) as CacheEntry<T> | undefined;
		if (!entry) {
			entry = {
				status: "idle",
				updatedAt: 0,
				staleSeconds: this.defaultStaleSeconds,
				subscribers: new Set(),
			};
			this.cache.set(keyStr, entry as CacheEntry<any>);
		}
		return entry as CacheEntry<T>;
	}

	private indexPathKey(pathKey: string, keyStr: string) {
		let set = this.pathIndex.get(pathKey);
		if (!set) this.pathIndex.set(pathKey, (set = new Set<string>()));
		set.add(keyStr);
	}

	private notify(entry: CacheEntry) {
		for (const cb of entry.subscribers) cb();
	}

	public getQueryData<T>(key: QueryKey): T | undefined {
		const ks = this.keyToString(key);
		const entry = this.cache.get(ks) as CacheEntry<T> | undefined;
		return entry?.data;
	}

	public subscribe(key: QueryKey, cb: () => void): () => void {
		const ks = this.keyToString(key);
		const entry = this.ensureEntry(ks);
		entry.subscribers.add(cb);
		return () => entry.subscribers.delete(cb);
	}

	public isStale(entry: CacheEntry): boolean {
		const age = os.clock() - entry.updatedAt;
		return age >= entry.staleSeconds;
	}

	public async fetchQuery<T>(options: FetchQueryOptions<T>): Promise<T> {
		const { key, fetch, enabled = true } = options;
		const ks = this.keyToString(key);
		const [pathKey] = key;
		const entry = this.ensureEntry<T>(ks);
		entry.staleSeconds = options.staleSeconds ?? entry.staleSeconds ?? this.defaultStaleSeconds;
		entry.fetch = fetch;
		this.indexPathKey(pathKey, ks);

		if (!enabled) return Promise.resolve(entry.data as T);

		if (entry.promise) return entry.promise;
		if (entry.status === "success" && !this.isStale(entry)) return Promise.resolve(entry.data as T);

		entry.status = "loading";
		const p = fetch()
			.then((data) => {
				entry.data = data;
				entry.error = undefined;
				entry.status = "success";
				entry.updatedAt = os.clock();
				entry.promise = undefined;
				this.notify(entry);
				return data;
			})
			.catch((err) => {
				entry.error = err;
				entry.status = "error";
				entry.updatedAt = os.clock();
				entry.promise = undefined;
				this.notify(entry);
				throw err;
			});
		entry.promise = p;
		return p;
	}

	public invalidatePath(pathKey: string) {
		const set = this.pathIndex.get(pathKey);
		if (!set) return;
		for (const ks of set) {
			const entry = this.cache.get(ks);
			if (!entry) continue;
			entry.updatedAt = 0; // mark stale
			this.notify(entry);
		}
	}

	public invalidateKey(key: QueryKey) {
		const ks = this.keyToString(key);
		const entry = this.cache.get(ks);
		if (!entry) return;
		entry.updatedAt = 0;
		this.notify(entry);
	}

	public invalidateByPredicate(predicate: (keyString: string) => boolean) {
		for (const [ks, entry] of this.cache) {
			if (predicate(ks)) {
				entry.updatedAt = 0;
				this.notify(entry);
			}
		}
	}
}

export { QueryKey };
