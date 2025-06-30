export const stringify = <T>(text: T) => {
    return JSON.stringify(text, null, 2)
}