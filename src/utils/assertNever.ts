/** Makes a switch exhaustive: TypeScript fails to compile if a case is missing. */
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}