export const HttpMethod = {
    GET: "GET",
    DELETE: "DELETE",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    HEAD: "HEAD",
    OPTIONS: "OPTIONS",
    CONNECT: "CONNECT",
    TRACE: "TRACE",
};
export const HttpMethodOrder = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "CONNECT",
    "TRACE",
];
export function isHttpMethod(value) {
    return HttpMethod[value] != null;
}
export const METHOD_COLOR_SCHEMES = {
    GET: "green",
    DELETE: "red",
    POST: "blue",
    PUT: "amber",
    PATCH: "orange",
    HEAD: "gray",
    OPTIONS: "bronze",
    CONNECT: "sky",
    TRACE: "purple",
};
