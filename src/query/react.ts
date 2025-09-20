import React from "@rbxts/react";
import { QueryClient, QueryKey, FetchQueryOptions } from "./client";

const QueryClientContext = React.createContext<QueryClient | undefined>(undefined);

export function QueryClientProvider(props: { client: QueryClient; children: React.ReactNode }) {
	return React.createElement(QueryClientContext.Provider, { value: props.client }, props.children);
}

export function useQueryClient(): QueryClient {
	const ctx = React.useContext(QueryClientContext);
	if (!ctx) throw "Missing QueryClientProvider";
	return ctx;
}

export function useQuery<T>(options: FetchQueryOptions<T>) {
	const client = useQueryClient();
	const [data, setData] = React.useState<T | undefined>(client.getQueryData<T>(options.key));
	const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
	const [queryError, setQueryError] = React.useState<unknown>(client.getQueryError(options.key));
	const [, force] = React.useReducer(
		(s: number) => s + 1,
		0,
		(x) => x,
	);

	React.useEffect(() => {
		const unsubscribe = client.subscribe(options.key, () => {
			setData(client.getQueryData<T>(options.key));
			setQueryError(client.getQueryError(options.key));
			force();
		});
		return unsubscribe;
	}, [client, options.key[0]]);

	React.useEffect(() => {
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
	return { data, status, isLoading, isError, isSuccess, error: queryError } as const;
}

export function useMutation<TInput, TOutput>(mutateFn: (input: TInput) => Promise<TOutput>) {
	const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
	const [err, setErr] = React.useState<unknown>(undefined);
	async function mutate(input: TInput): Promise<TOutput> {
		setStatus("loading");
		try {
			const out = (await mutateFn(input)) as TOutput;
			setStatus("success");
			return out;
		} catch (e) {
			setErr(e);
			setStatus("error");
			throw e;
		}
	}
	return { mutate, status, err } as const;
}
