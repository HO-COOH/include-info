import * as vscode from 'vscode';
import * as commands from "./commands";
import { SizeUnit, toSizeUnit, getSizeUnitEnum } from './sizeUnit';
import { DigitSeperator, addSeperator, getDigitSeperator} from "./seperator"
import { StringifyingMap } from "./StringifyMap";


function getCurrentUri()
{
    return vscode.window.activeTextEditor?.document.uri!;
}

function getCurrentDocument()
{
    return vscode.window.activeTextEditor?.document;
}

function getCurrentPosition() 
{
    return vscode.window.activeTextEditor?.selection.start;
}

function getCurrentRange()
{
    return vscode.window.activeTextEditor?.document.getWordRangeAtPosition(getCurrentPosition()!);
}

function getCurrentEditor()
{
    return vscode.window.activeTextEditor;
}

function getFileUri(definition: (vscode.Location | vscode.LocationLink)[])
{
    /*debug */
    // if (definition.length == 0)
    //     console.log(`Error!`);
    return (definition[0] as vscode.Location).uri;
}

function getIncludePosition(document: vscode.TextDocument, matchIndex: number): vscode.Position
{
    return document.positionAt(matchIndex);
}

const commentRegex = /(\/\*[\s\S]+?\*\/)|(\/\/.*)/g;
const commentReplaceRegex = /[^\n]/g;

function removeComment(document: vscode.TextDocument)
{
    return document.getText().replace(commentRegex, "");
}

function replaceCommentWithSpace(document: vscode.TextDocument)
{
    return document.getText().replace(commentRegex, (match) =>
    {
        return match.replace(commentReplaceRegex, " ");
    });
}

function getPositionFromRegexMatch(document: vscode.TextDocument, match: RegExpExecArray, matchGroup: number):vscode.Position
{
    const line = document.lineAt(document.positionAt(match.index).line);
    const indexOf = line.text.indexOf(match[matchGroup]);
    return new vscode.Position(line.lineNumber, indexOf);
}

class IncludeInfo
{
    position: vscode.Position;
    isQuoed: boolean;
    constructor(position: vscode.Position, isQuoted: boolean)
    {
        this.position = position;
        this.isQuoed = isQuoted;
    }
}

class FileInfo
{
    lines: number;
    bytes: number;
    mtime: number;
    includedFiles: Map<string, IncludeInfo> = new Map();

    constructor(lines: number, bytes: number, mtime: number)
    {
        this.lines = lines;
        this.bytes = bytes;
        this.mtime = mtime;
    }

    addIncludedFile(fileName: string, info: IncludeInfo)
    {
        this.includedFiles.set(fileName, info);
    }



    getIncludedFilesNum()
    {
        return this.includedFiles.size;
    }

    getIncludedFileList()
    {
        let list: string[] = [];
        for (const iterator of this.includedFiles) 
        {
            if (iterator[1].isQuoed)
                list.push(`"${iterator[0]}"`);
            else
                list.push(`<${iterator[0]}>`)
        }
        list.push("Go To Header");
        return list;
    }
}

class UriMap extends StringifyingMap<vscode.Uri, FileInfo>
{
    protected stringifyKey(key: vscode.Uri): string
    {
        return key.fsPath;
    }
}

class Configuration
{
    sizeUnit: SizeUnit;
    decimalDigits: number;
    seperator: DigitSeperator;
    constructor()
    {
        const config = vscode.workspace.getConfiguration("Include Info");
        this.sizeUnit = getSizeUnitEnum(config.get<string>("File Size Unit", "KB"))!;
        this.decimalDigits = config.get<number>("File Size Decimal Digit", 2);
        this.seperator = getDigitSeperator(config.get<string>("File Line Number Seperator", "Comma"))!;
    }
}

function getFileNameFromUri(uri: vscode.Uri): string
{
    const path = uri.path;
    return path.substring(path.lastIndexOf("/") + 1);
}

let config = new Configuration();

class IncludeDirective
{
    position: vscode.Position;
    currentUri: vscode.Uri | undefined = undefined;
    
    static cache: UriMap = new UriMap();
    static tempFileNameToUriMap: Map<string, vscode.Uri> = new Map();

    constructor(position: vscode.Position)
    {
        this.position = position;
        config = new Configuration();
    }

    /**
     * Return the info of an included file, in a recursive fashion
     * @param file The uri of the included file
     */
    private async findAllInclude(file: vscode.Uri): Promise<FileInfo | undefined>
    {
        this.currentUri = file;
        /*Check if the file is modified */
        const currentFileMtime = (await vscode.workspace.fs.stat(file)).mtime;
        if (IncludeDirective.cache.has(file))
        {
            const cachedFileInfo = IncludeDirective.cache.get(file);
            if (currentFileMtime === cachedFileInfo.mtime)
                return cachedFileInfo;
        }

        /*Use regex to find all the includes */
        const includeRegex = /#include\s*([<"])\s*(.*)\s*[>"]/g;
        return await vscode.workspace.openTextDocument(file).then(async content =>
        {
            let currentFileInfo = new FileInfo(0, 0, currentFileMtime);
            const contentString = replaceCommentWithSpace(content);
            let matches;
            //for each include
            while ((matches = includeRegex.exec(contentString)) !== null)
            {
                /*push included file into the list */
                const isQuoed = (matches[1] === "\"");
                const pos = getPositionFromRegexMatch(content, matches, 2);
                currentFileInfo.includedFiles.set(matches[2], new IncludeInfo(pos, isQuoed));
            }

            currentFileInfo.bytes += contentString.length;
            currentFileInfo.lines += content.lineCount;
            
            IncludeDirective.cache.set(file, currentFileInfo);
            return currentFileInfo;
        });
    }


    toString():Thenable<string>
    {
        const currentUri = getCurrentUri();
        if (currentUri !== undefined)
        {
            return commands.definitionProvider(currentUri, this.position).then(async definition =>
            {
                let uri = getFileUri(definition);
                const includeLineText = vscode.window.activeTextEditor?.document.lineAt(this.position.line)!.text!;
                const fileName = includeLineText.match(/#include\s*[<"]\s*(.*)\s*[>"]/)![1];
                if (!includeLineText.includes(getFileNameFromUri(getFileUri(definition)))) //spurious definition
                    uri = IncludeDirective.tempFileNameToUriMap.get(fileName)!;
                else
                    IncludeDirective.tempFileNameToUriMap.set(fileName, uri);
                return this.findAllInclude(uri).then(
                    info =>
                    {
                        if (info !== undefined)
                            return `Size: ${toSizeUnit(info.bytes, config.sizeUnit, config.decimalDigits)} | Lines: ${addSeperator(info.lines, config.seperator)} | Included Files: ${info.getIncludedFilesNum()}`;
                        else
                            return `No info`;
                    }
                )
            });
        }
        else
            return new Promise<string>(()=>" ");
    }


    getIncludedFileList()
    {
        return IncludeDirective.cache.get(this.currentUri!);
    }
}


/**
 * Provide CodeLens info
 */
class IncludeSizeProvider implements vscode.CodeLensProvider
{
    private includeRegex = /(#include\s*[<"]\s*).*\s*[>"]/g;
    onDidChangeCodeLenses?: vscode.Event<void> | undefined;

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]>
    {
        if (vscode.workspace.getConfiguration("Include Info").get<boolean>("Auto Show Include Info", false))
        {
            let codeLenses: vscode.CodeLens[] = [];
            let matches;

            const text = replaceCommentWithSpace(document);
            /*find all include in current document */
            while ((matches = this.includeRegex.exec(text)) !== null)
            {
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[1]);
                const position = new vscode.Position(line.lineNumber, indexOf + matches[1].length);
                const range = new vscode.Range(position, new vscode.Position(line.lineNumber, line.text.length));
                if (range)
                {
                    codeLenses.push(new vscode.CodeLens(range));
                }
            }
            return codeLenses;
        }
        return [];
    }

    /**
     * CodeLens is a command that shown along with source texxt, like the number of references, a way to run tests ... etc
     * The available info of a CodeLen object is:
     * class CodeLens
     * {
     *      range: vscode.Range;
     * }
     *
     */
    resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken)
    {
        const includeDirective = new IncludeDirective(codeLens.range.start);
        return includeDirective.toString().then(async str =>
        {
            return new vscode.CodeLens(codeLens.range, {
                title: str,
                command: "include-info.goToHeader",
                arguments: [includeDirective]
            });
        });
    }
};


export function activate(context: vscode.ExtensionContext) 
{
    if (vscode.workspace.getConfiguration("Include Info").get<boolean>("Auto Show Include Info", false))
        vscode.languages.registerCodeLensProvider("*", new IncludeSizeProvider);

    let disposable = vscode.commands.registerCommand('include-info.showInfo', () => 
    {
        vscode.languages.registerCodeLensProvider("*", new IncludeSizeProvider);
    });

    vscode.commands.registerCommand("include-info.goToHeader", async (includeDirective: IncludeDirective) =>
    {
        const info = includeDirective.getIncludedFileList();
        vscode.window.showQuickPick(info.getIncludedFileList()).then(async selection =>
        {
            if (selection)
            {
                if (selection === "Go To Header")
                    vscode.window.showTextDocument(includeDirective.currentUri!);
                else
                {
                    selection = selection?.substr(1, selection.length - 2);
                    vscode.workspace.openTextDocument(includeDirective.currentUri!).then(doc =>
                    {
                        vscode.window.showTextDocument(doc).then(async () =>
                        {
                            const matchedFileUri = getFileUri(await commands.definitionProvider(doc.uri, info.includedFiles.get(selection!)?.position!));
                            vscode.window.showTextDocument(matchedFileUri);
                        })
                    })
                }
            }
        });
    });

}

// this method is called when your extension is deactivated
export function deactivate() { }