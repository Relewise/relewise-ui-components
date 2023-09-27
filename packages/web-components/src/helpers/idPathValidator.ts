export function idPathAsArray(idPath: string | null): string[] | null {
    if (!idPath || !idPath.trim()) {
        console.error('No id-path provided!');
        return null;
    }

    const idPathAsArray = idPath.split('/');
    if (idPathAsArray.some(item => !item.trim())) {
        console.error(`${idPath} is not a valid id-path!`); 
        return null;
    } 
    
    return idPathAsArray;
}