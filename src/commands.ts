/**
 * Some helper functions to access the vscode language server
 */
import * as vscode from 'vscode';

/**
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of SymbolInformation and DocumentSymbol instances.
 */
export function documentHighlights(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeDocumentHighlights") as Thenable<(vscode.SymbolInformation | vscode.DocumentSymbol)[]>;
}

/**
 * @param uri Uri of a text document
 * @returns A promise that resolves to an array of DocumentHighligh instances 
 */
export function documentSymbolProvider(uri: vscode.Uri)
{
    return vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", uri) as Thenable<vscode.DocumentHighlight[]>;
}

/**
 * @param uri Uri of a text document
 * @param options FormattingOptions
 * @returns A promise that resolves to an array of TextEdits
 */
export function formatDocumentProvider(uri: vscode.Uri, options: vscode.FormattingOptions)
{
    return vscode.commands.executeCommand("vscode.executeFormatDocumentProvider", uri, options) as Thenable<vscode.TextEdit[]>;
}

/**
 * @param uri Uri of a text document
 * @param range A range in a text document
 * @param options Formatting options
 * @returns A promise that resolves to an array of TextEdits
 */
export function formatRangeProvider(uri: vscode.Uri, range: vscode.Range, options: vscode.FormattingOptions) 
{
    return vscode.commands.executeCommand("vscode.executeFormatRangeProvider", uri, range, options) as Thenable<vscode.TextEdit[]>;
}

/**
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @param triggerCharacter Trigger character
 * @param options Formatting options
 * @returns A promise that resolves to an array of TextEdits.
 */
export function formatOnTypeProvider(uri: vscode.Uri, position: vscode.Position, triggerCharacter: string, options: vscode.FormattingOptions)
{
    return vscode.commands.executeCommand("vscode.executeFormatOnTypeProvider", uri, position, triggerCharacter, options) as Thenable<vscode.TextEdit[]>;
}

/** 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Location or LocationLink instances.
 */
export function definitionProvider(uri: vscode.Uri, position: vscode.Position)
{
    /*debug */
    //console.log(`File ${uri.path}`)
    return vscode.commands.executeCommand("vscode.executeDefinitionProvider", uri, position) as Thenable<(vscode.Location | vscode.LocationLink)[]>;
}

/**
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Location or LocationLink instances.
 */
export function typeDefinitionProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeTypeDefinitionProvider", uri, position) as Thenable<(vscode.Location | vscode.LocationLink)[]>;
}

/**
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Location or LocationLink instances.
 */
export function declarationProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeDeclarationProvider", uri, position) as Thenable<(vscode.Location | vscode.LocationLink)[]>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Location or LocationLink instances.
 */
export function implementationProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeImplementationProvider", uri, position) as Thenable<(vscode.Location | vscode.LocationLink)[]>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Location-instances.
 */
export function referenceProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeReferenceProvider", uri, position) as Thenable<vscode.Location[]>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @returns A promise that resolves to an array of Hover-instances.
 */
export function HoverProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeHoverProvider", uri, position) as Thenable<vscode.Hover[]>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position Position in a text document
 * @returns A promise that resolves to an array of ranges.
 */
export function selectionRangeProvider(uri: vscode.Uri, position: vscode.Position)
{
    return vscode.commands.executeCommand("vscode.executeSelectionRangeProvider", uri, position) as Thenable<vscode.Range[]>;
}

/**
 * @param query Search string
 * @returns A promise that resolves to an array of SymbolInformation-instances.
 */
export function workspaceSymbolProvider(query: string)
{
    return vscode.commands.executeCommand("vscode.executeWorkspaceSymbolProvider", query) as Thenable<vscode.SymbolInformation[]>;
}

// export function prepareCallHierarchy(uri: vscode.Uri, position: vscode.Position)
// {
//     return vscode.commands.executeCommand("vscode.prepareCallHierarchy", uri, position) as vscode.CallHierarchyItem | undefined;
// }

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @param newName The new symbol name
 * @returns A promise that resolves to a WorkspaceEdit.
 */
export function documentRenameProvider(uri: vscode.Uri, position: vscode.Position, newName: string)
{
    return vscode.commands.executeCommand("vscode.executeDocumentRenameProvider", uri, position, newName) as Thenable<vscode.WorkspaceEdit>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param linkResolveCount  (optional) Number of links that should be resolved, only when links are unresolved
 * @returns A promise that resolves to an array of DocumentLink-instances.
 */
export function linkProvider(uri: vscode.Uri, linkResolveCount?: number)
{
    return vscode.commands.executeCommand("vscode.executeLinkProvider", uri, linkResolveCount) as Thenable<vscode.DocumentLink[]>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @param triggerCharacter (optional) Trigger completion when the user types the character, like ',' or '('
 * @param itemResolveCount (optional) Number of completions to resolve (too large numbers slow down completions)
 * @returns A promise that resolves to a CompletionList-instance.
 */
export function completionItemProvider(uri: vscode.Uri, position: vscode.Position, triggerCharacter?: string, itemResolveCount?: number)
{
    return vscode.commands.executeCommand("vscode.executeCompletionItemProvider", uri, position, triggerCharacter, itemResolveCount) as Thenable<vscode.CompletionList>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param position A position in a text document
 * @param triggerCharacter (optional) Trigger signature help when the user types the character, like ',' or '('
 * @returns A promise that resolves to SignatureHelp.
 */
export function signatureHelpProvider(uri: vscode.Uri, position: vscode.Position, triggerCharacter?: string)
{
    return vscode.commands.executeCommand("vscode.executeSignatureHelpProvider", uri, position, triggerCharacter) as Thenable<vscode.SignatureHelp>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param itemResolveCount (optional) Number of lenses that should be resolved and returned. Will only return resolved lenses, will impact performance)
 * @returns A promise that resolves to an array of CodeLens-instances
 */
export function codeLensProvider(uri: vscode.Uri, itemResolveCount?: number)
{
    return vscode.commands.executeCommand("vscode.executeCodeLensProvider", uri, itemResolveCount) as Thenable<vscode.CodeLens>;
}

/**
 * 
 * @param uri Uri of a text document
 * @param rangeOrSelection Range in a text document. Some refactoring provider requires Selection object.
 * @param kind (optional) Code action kind to return code actions for
 * @param itemResolveCount (optional) Number of code actions to resolve (too large numbers slow down code actions)
 * @returns A promise that resolves to an array of Command-instances.
 */
export function codeActionProvider(uri: vscode.Uri, rangeOrSelection: vscode.Range | vscode.Selection, kind?: vscode.CodeActionKind, itemResolveCount?: number)
{
    return vscode.commands.executeCommand("vscode.executeCodeActionProvider", uri, rangeOrSelection, kind, itemResolveCount) as Thenable<vscode.Command>;
}

/**
 * 
 * @param uri Uri of a text document
 * @returns A promise that resolves to an array of ColorInformation objects.
 */
export function documentColorProvider(uri: vscode.Uri)
{
    return vscode.commands.executeCommand("vscode.executeDocumentColorProvider", uri) as Thenable<vscode.ColorInformation[]>;
}

/**
 * 
 * @param color The color to show and insert
 * @param context Context object with uri and range
 * @returns A promise that resolves to an array of ColorPresentation objects.
 */
export function colorPresentationProvider(color: vscode.Color, context: { uri: vscode.Uri, range: vscode.Range })
{
    return vscode.commands.executeCommand("vscode.executeColorPresentationProvider", color, context) as Thenable<vscode.ColorPresentation[]>;
}

// export function inlineHintProvider(uri: vscode.Uri, range: vscode.Range)
// {
//     return vscode.commands.executeCommand("vscode.executeInlineHintProvider", uri, range) as Thenable<vscode.Inline
// }