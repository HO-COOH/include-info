export enum SizeUnit
{
    B = 1,
    KB = 1024,
    MB = 1024 * 1024,
    Auto
}

export function toSizeUnit(size: number, unit: SizeUnit, decimalDigits: number = 2): string
{
    if (unit === SizeUnit.Auto)
    {
        const sizeMB = size / SizeUnit.MB;
        if (sizeMB > 1)
            return `${sizeMB.toFixed(decimalDigits)} MB`;
        const sizeKB = size / SizeUnit.KB;
        if (sizeKB > 1)
            return `${sizeKB.toFixed(decimalDigits)} KB`;
    }
    if (unit === SizeUnit.B)
        return `${size.toString()} Bytes`;
    return `${(size / unit).toFixed(decimalDigits)} ${SizeUnit[unit]}`;
}

export function getSizeUnitEnum(enumString: string) 
{
    switch (enumString)
    {
        case "Bytes":   return SizeUnit.B;
        case "KB":      return SizeUnit.KB;
        case "MB":      return SizeUnit.MB;
        case "Auto":    return SizeUnit.Auto;
    }
}