import { config } from 'node:process';
import * as vscode from 'vscode';
import * as commands from "./commands";
import { SizeUnit, toSizeUnit, getSizeUnitEnum } from './sizeUnit';
import { DigitSeperator, addSeperator, getDigitSeperator} from "./seperator"
import { StringifyingMap } from "./StringifyMap";
import { isStdHeader } from "./stdHeaders"



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
	if (definition.length == 0)
		console.log(`Error!`);
	return (definition[0] as vscode.Location).uri;
}

function getIncludePosition(document: vscode.TextDocument, matchIndex: number): vscode.Position
{
	return document.positionAt(matchIndex);
}

function removeComment(document: vscode.TextDocument)
{
	const commentRegex = /(\/\*[\s\S]+?\*\/)|(\/\/.*)/g;
	return document.getText().replace(commentRegex, "");
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

	static includedFiles: UriMap = new UriMap();
	static config: Configuration = new Configuration();


	/*disable recursion for now*/
	static recursion = false;

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
		{
			return IncludeDirective.includedFiles.get(file)!;
		}

		IncludeDirective.includedFiles.set(file, new FileInfo(0, 0));

		/*Use regex to find all the includes */
		const includeRegex = /#include\s*[<"](.*)[>"]/g;
		return await vscode.workspace.openTextDocument(file).then(async content =>
		{
			let currentFileInfo = new FileInfo(0, 0);
			const contentString = removeComment(content);
			let matches;
			//for each include
			while ((matches = includeRegex.exec(contentString)) !== null)
			{
				if (IncludeDirective.recursion)
				{
					const definitionResult = await commands.definitionProvider(content.uri, getIncludePosition(content, matches.index + matches[0].indexOf(matches[1])));
					const uri = getFileUri(definitionResult);
					const includedFileInfo = await this.findAllInclude(uri);
					if (includedFileInfo !== undefined)
					{
						currentFileInfo.bytes += includedFileInfo.bytes;
						currentFileInfo.lines += includedFileInfo.lines;
					}
				}
				++currentFileInfo.includedFileNum;
			}

			currentFileInfo.bytes += contentString.length;
			currentFileInfo.lines += content.lineCount;
			if (isStdHeader(getFileNameFromUri(file)))
				IncludeDirective.includedFiles.set(file, currentFileInfo);
			else
				IncludeDirective.includedFiles.delete(file);
			return currentFileInfo;
		});
	}


	toString()
	{
		return commands.definitionProvider(getCurrentUri()!, this.position).then(async definition =>
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

	async getUri()
	{
		return getFileUri(await commands.definitionProvider(getCurrentUri()!, this.position));
	}
}



class IncludeSizeProvider implements vscode.CodeLensProvider
{
	private includeRegex = /(#include\s*[<"]).*[>"]/g;

	onDidChangeCodeLenses?: vscode.Event<void> | undefined;

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]>
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
				arguments: [await includeDirective.getUri()]
			});
		});
	}
};


function getSettings()
{

}

export function activate(context: vscode.ExtensionContext) 
{

	console.log('Congratulations, your extension "include-info" is now active!');


	vscode.languages.registerCodeLensProvider("*", new IncludeSizeProvider);

	let disposable = vscode.commands.registerCommand('include-info.helloWorld', () => 
	{
		vscode.window.showInformationMessage('include-info!');
	});

	vscode.commands.registerCommand("include-info.goToHeader", (uri: vscode.Uri) =>
	{
		vscode.window.showTextDocument(uri, {
			preserveFocus: false
		});
	})


}

// this method is called when your extension is deactivated
export function deactivate() { }