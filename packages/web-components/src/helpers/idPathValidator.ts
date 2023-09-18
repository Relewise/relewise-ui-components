export function validateIdPath(idPath: string[]): boolean {
    return idPath.some(item => !item.trim());
}