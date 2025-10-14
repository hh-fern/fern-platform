export function readBuffer(val: Buffer): unknown {
    const raw = val.toString();
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to parse buffer: ${raw}`);
        throw e;
    }
}
