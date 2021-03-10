import { config } from 'node:process';
import * as vscode from 'vscode';
import * as commands from "./commands";
import { SizeUnit, toSizeUnit, getSizeUnitEnum } from './sizeUnit';
import { DigitSeperator, addSeperator, getDigitSeperator} from "./seperator"
import { StringifyingMap } from "./StringifyMap";
import { isStdHeader } from "./stdHeaders"
import { resolve } from 'node:path';



function getCurrentUri()
{
    return vscode.window.activeTextEditor?.document.uri;
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
    let offset = 0;
    for (let i = 0; i < matchGroup; ++i)
        offset += match[i].length;
    return new vscode.Position(line.lineNumber, indexOf + offset);
}

class FileInfo
{
    lines: number;
    bytes: number;
    includedFileNum: number = 0;
    constructor(lines: number, bytes: number)
    {
        this.lines = lines;
        this.bytes = bytes;
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

class IncludeDirective
{
    position: vscode.Position;
    isStd: boolean = false;
    
    static stdIncludedFileNameList: Map<string, Map<string, vscode.Position>> = new Map();  //cache std for faster look-up, <stdHeaderName> <-> (includedHeader <-> Position)
    includedFileNameList: Map<string, vscode.Position> = new Map();     //don't cache non-std headers, <headerName> <-> Position
    
    static includedFiles: UriMap = new UriMap();
    static config: Configuration = new Configuration();


    /*disable recursion for now*/
    //static recursion = false;

    constructor(position: vscode.Position)
    {
        this.position = position;
        IncludeDirective.config = new Configuration();
    }

    /**
     * Return the info of an included file, in a recursive fashion
     * @param file The uri of the included file
     */
    private async findAllInclude(file: vscode.Uri): Promise<FileInfo | undefined>
    {
        if (IncludeDirective.includedFiles.has(file))
            return IncludeDirective.includedFiles.get(file)!;

        /*Use regex to find all the includes */
        const includeRegex = /#include\s*[<"]\s*(.*)\s*[>"]/g;
        return await vscode.workspace.openTextDocument(file).then(async content =>
        {
            let currentFileInfo = new FileInfo(0, 0);
            //const contentString = removeComment(content);
            const contentString = replaceCommentWithSpace(content);
            const fileName = getFileNameFromUri(file);
            this.isStd = isStdHeader(fileName);
            let matches;
            //for each include
            while ((matches = includeRegex.exec(contentString)) !== null)
            {
                ++currentFileInfo.includedFileNum;
                /*push included file into the list */
                if (this.isStd)
                {
                    let oldList = IncludeDirective.stdIncludedFileNameList.get(fileName);
                    if (oldList === undefined)
                    {
                        IncludeDirective.stdIncludedFileNameList.set(fileName, new Map());
                        oldList = IncludeDirective.stdIncludedFileNameList.get(fileName)!;
                    }
                    oldList.set(matches[1], getPositionFromRegexMatch(content, matches, 1));
                }
                else
                    this.includedFileNameList.set(matches[1], getPositionFromRegexMatch(content, matches, 1));
            }

            currentFileInfo.bytes += contentString.length;
            currentFileInfo.lines += content.lineCount;
            
            if (this.isStd)
                IncludeDirective.includedFiles.set(file, currentFileInfo);
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
                return this.findAllInclude(getFileUri(definition)).then(
                    info =>
                    {
                        if (info !== undefined)
                            return `Size: ${toSizeUnit(info.bytes, IncludeDirective.config.sizeUnit, IncludeDirective.config.decimalDigits)} | Lines: ${addSeperator(info.lines, IncludeDirective.config.seperator)} | Included Files: ${info.includedFileNum}`;
                        else
                            return `No info`;
                    }
                )
            });
        }
        else
            return new Promise<string>(()=>" ");
    }


    async getUri()
    {
        return getFileUri(await commands.definitionProvider(getCurrentUri()!, this.position));
    }

    async getIncludedFileList()
    {
        const uri = await this.getUri();
        if(this.includedFileNameList.size === 0)
            return IncludeDirective.stdIncludedFileNameList.get(getFileNameFromUri(uri));
        else
            return this.includedFileNameList;
    }
}



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

            const text = document.getText();
            /*find all include */
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
            /*debug */
            //console.log(`Found ${codeLenses.length} include!`);
            return codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken)
    {
        const includeDirective = new IncludeDirective(codeLens.range.start);
        /*debug */
        //console.log("In resolveCodeLens()");
        return includeDirective.toString().then(async str =>
        {
            return new vscode.CodeLens(codeLens.range, {
                title: str,
                command: "include-info.goToHeader",
                arguments: [/*await includeDirective.getUri()*/ includeDirective]
            });
        });
    }
};


export function activate(context: vscode.ExtensionContext) 
{

    /*debug*/
    console.log('Congratulations, your extension "include-info" is now active!');

    if (vscode.workspace.getConfiguration("Include Info").get<boolean>("Auto Show Include Info", false))
        vscode.languages.registerCodeLensProvider("*", new IncludeSizeProvider);

    let disposable = vscode.commands.registerCommand('include-info.showInfo', () => 
    {
        /*debug*/
        vscode.languages.registerCodeLensProvider("*", new IncludeSizeProvider);
    });

    vscode.commands.registerCommand("include-info.goToHeader", async (includeDirective: IncludeDirective) =>
    {
        let includeMap = (await includeDirective.getIncludedFileList());
        if (!includeMap)
            includeMap = new Map();
        let fileList = Array.from(includeMap.keys());
        fileList = fileList.map(str => `<${str}>`);
        vscode.window.showQuickPick(fileList.concat(["Go To Header"])).then(async selection =>
        {
            if (selection)
            {
                if (selection === "Go To Header")
                    vscode.window.showTextDocument(await includeDirective.getUri()!);
                else
                {
                    selection = selection?.substr(1, selection.length - 2);
                    vscode.workspace.openTextDocument(await includeDirective.getUri()).then(doc =>
                    {
                        vscode.window.showTextDocument(doc).then(async () =>
                        {
                            const matchedFileUri = getFileUri(await commands.definitionProvider(doc.uri, includeMap?.get(selection!)!));
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