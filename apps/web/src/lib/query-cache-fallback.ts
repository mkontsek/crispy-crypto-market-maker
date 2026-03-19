type NetworkFirstCacheFallbackOptions<T> = {
    networkData: T;
    cachedData: T | undefined;
    isNetworkEmpty: (data: T) => boolean;
};

export function resolveNetworkFirstCacheFallback<T>(
    options: NetworkFirstCacheFallbackOptions<T>
): T {
    const { networkData, cachedData, isNetworkEmpty } = options;

    if (!isNetworkEmpty(networkData)) {
        return networkData;
    }

    if (cachedData !== undefined && !isNetworkEmpty(cachedData)) {
        return cachedData;
    }

    return networkData;
}
