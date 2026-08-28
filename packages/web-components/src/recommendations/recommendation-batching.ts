export type RecommendationBatchingContextValue<TRequest, TResponse> = {
    enabled?: boolean;
    requests: Array<{
        request: TRequest;
        id: EventTarget | null;
        result?: TResponse | null;
    }>;
};
