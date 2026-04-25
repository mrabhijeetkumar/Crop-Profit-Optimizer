exports.handler = async (event) => {
    const rawBase = process.env.API_BASE_URL || "";
    const apiBase = rawBase.trim().replace(/\/+$/, "");

    if (!apiBase) {
        return {
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ok: false,
                error: "API_BASE_URL is not configured in Netlify environment variables.",
            }),
        };
    }

    const proxyPrefix = "/.netlify/functions/proxy";
    const requestPath = event.path.startsWith(proxyPrefix)
        ? event.path.slice(proxyPrefix.length)
        : "";

    const query = event.rawQuery ? `?${event.rawQuery}` : "";
    const targetUrl = `${apiBase}${requestPath}${query}`;

    const outboundHeaders = {};
    const incomingHeaders = event.headers || {};

    Object.keys(incomingHeaders).forEach((key) => {
        const lowered = key.toLowerCase();
        if (["host", "content-length", "x-forwarded-for", "x-forwarded-proto", "x-nf-client-connection-ip"].includes(lowered)) {
            return;
        }
        outboundHeaders[key] = incomingHeaders[key];
    });

    const requestInit = {
        method: event.httpMethod,
        headers: outboundHeaders,
    };

    if (!["GET", "HEAD"].includes(event.httpMethod)) {
        requestInit.body = event.isBase64Encoded
            ? Buffer.from(event.body || "", "base64")
            : (event.body || "");
    }

    try {
        const response = await fetch(targetUrl, requestInit);
        const contentType = response.headers.get("content-type") || "";
        const isTextLike = contentType.includes("application/json") || contentType.includes("text/") || contentType.includes("application/javascript");

        const responseBody = isTextLike
            ? await response.text()
            : Buffer.from(await response.arrayBuffer()).toString("base64");

        return {
            statusCode: response.status,
            isBase64Encoded: !isTextLike,
            headers: {
                "content-type": contentType || "application/octet-stream",
                "cache-control": "no-store",
            },
            body: responseBody,
        };
    } catch (error) {
        return {
            statusCode: 502,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ok: false,
                error: "Backend proxy request failed.",
            }),
        };
    }
};
