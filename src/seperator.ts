export enum DigitSeperator
{
    Comma = ",",
    Backtick = "`",
    Space = " ",
    None = ""
}

export function addSeperator(value: number, seperator: DigitSeperator): string
{
    if (seperator === DigitSeperator.None)
        return value.toString();
    
    return [...value.toString()].map(
        (digit, index, allDigits) => (!index || (allDigits.length - index) % 3 ? '' : seperator) + digit
    ).join('');
}

export function getDigitSeperator(enumString: string) 
{
    switch (enumString)
    {
        case "Comma":       return DigitSeperator.Comma;
        case "Backtick":    return DigitSeperator.Backtick;
        case "Space":       return DigitSeperator.Space;
        case "None":        return DigitSeperator.None;
    }
}