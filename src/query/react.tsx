import React, { createContext, useContext, useState, useEffect, useReducer } from "@rbxts/react";
import { QueryClient, QueryKey, FetchQueryOptions } from "./client";

// Create context with a default QueryClient to avoid undefined issues
const defaultQueryClient = new QueryClient();
const QueryClientContext = createContext<QueryClient>(defaultQueryClient);

export function QueryClientProvider(props: { client: QueryClient; children: React.ReactNode }) {
	return <QueryClientContext.Provider value={props.client}>{props.children}</QueryClientContext.Provider>;
}

export function useQueryClient(): QueryClient {
	return useContext(QueryClientContext);
}

export function useQuery<T>(options: FetchQueryOptions<T>) {
	const client = useQueryClient();
	const [data, setData] = useState<T | undefined>(client.getQueryData<T>(options.key));
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [queryError, setQueryError] = useState<unknown>(client.getQueryError(options.key));
	const [, force] = useReducer(
		(s: number) => s + 1,
		0,
		(x: number) => x,
	);

	useEffect(() => {
		const unsubscribe = client.subscribe(options.key, () => {
			setData(client.getQueryData<T>(options.key));
			setQueryError(client.getQueryError(options.key));
			force();
		});
		return unsubscribe;
	}, [client, options.key[0]]);

	useEffect(() => {
		setStatus("loading");
		client
			.fetchQuery(options)
			.then((d) => {
				setData(d);
				setQueryError(undefined);
				setStatus("success");
			})
			.catch((e) => {
				setQueryError(e);
				setStatus("error");
			});
	}, [client, options.key[0]]);

	const isLoading = status === "loading";
	const isError = status === "error";
	const isSuccess = status === "success";
	return { data, status, isLoading, isError, isSuccess, queryError } as const;
}

export function useMutation<TInput, TOutput>(mutateFn: (input: TInput) => Promise<TOutput>) {
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [queryError, setQueryError] = useState<unknown>(undefined);
	async function mutate(input: TInput): Promise<TOutput> {
		setStatus("loading");
		try {
			const out = (await mutateFn(input)) as TOutput;
			setStatus("success");
			return out;
		} catch (e) {
			setQueryError(e);
			setStatus("error");
			throw e;
		}
	}
	return { mutate, status, queryError } as const;
}
