import { 
  commands, CompleteResult, ExtensionContext, listManager, sources, window, workspace, 
  services, LanguageClient, Uri
} from 'coc.nvim';
import DemoList from './lists';

export async function activate(context: ExtensionContext): Promise<void> {
  const { nvim } = workspace;
  let lastTerminalBufnr: number | null = null;

  const stopAction = async () => {
    if (lastTerminalBufnr) {
      const bufnr = lastTerminalBufnr;
      const exists = await nvim.call('bufexists', [bufnr]) as boolean;

      if (exists) {
        const winid = await nvim.call('bufwinid', [bufnr]) as number;
        if (winid !== -1) {
          await nvim.call('win_execute', [winid, 'close!']);
        }
        await nvim.command(`silent! bwipeout! ${bufnr}`);
        window.showInformationMessage('Quarkdown action stopped.');
      }
      lastTerminalBufnr = null;
    }
  };

  const applyHighlights = async () => {
    const highlights = [
      'hi default link CocSemFunction Function',
      'hi default link CocSemParameter Special', 
      'hi default link CocSemVariable Identifier',
      'hi default link CocSemType Type',
      'hi default link CocSemKeyword Keyword',
    ];
    for (const line of highlights) await nvim.command(line);
  };

  const applySyntax = async () => {
    const hasSyntax = await nvim.getVar('current_syntax').catch(() => null);
    if (hasSyntax === 'quarkdown') {
      return;
    }

    const commands = [
      'syn match qdComment /\\/\\/.*/',
'syn region qdString start=/"/ skip=/\\"/ end=/"/',
'syn match qdNumber /\\<\\d\\+\\>/',
'syn match qdOperator /[:=+\\-*\\/]/',
'syn keyword qdBoolean true false',
'hi def link qdComment Comment',
'hi def link qdString String',
'hi def link qdNumber Constant',
'hi def link qdOperator Statement',
'hi def link qdBoolean Boolean',
'let b:current_syntax = "quarkdown"'
    ];

    for (const cmd of commands) {
      await nvim.command(cmd);
    }
  };

  const setupDefaultKeymaps = async () => {
    await nvim.command('nnoremap <buffer> <silent> <leader>mc :CocCommand coc-quarkdown.compile<CR>');
    await nvim.command('nnoremap <buffer> <silent> <leader>mw :CocCommand coc-quarkdown.watch<CR>');
    await nvim.command('nnoremap <buffer> <silent> <leader>ms :CocCommand coc-quarkdown.stop<CR>');
  };

  const initializeBuffer = async () => {
    await applySyntax();
    await applyHighlights();
    await setupDefaultKeymaps(); 
  };

  const semanticConfig = workspace.getConfiguration('semanticTokens');
  const filetypes = semanticConfig.get<string[]>('filetypes', []);
  if (!filetypes.includes('quarkdown')) {
    filetypes.push('quarkdown');
    semanticConfig.update('filetypes', filetypes, true);
  }

  context.subscriptions.push(
    commands.registerCommand("coc-quarkdown.stop", stopAction),

    commands.registerCommand("coc-quarkdown.compile", async () => {
      const doc = await workspace.document;
      if (!doc || !doc.uri.startsWith('file')) {
        window.showErrorMessage("Current buffer is not a saved file.");
        return;
      }
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call('win_getid') as number;
        const path = Uri.parse(doc.uri).fsPath.replace(/ /g, '\\ ');
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown c ${path}`);
        lastTerminalBufnr = await nvim.call('bufnr', ['%']) as number;
        await nvim.command('setlocal nobuflisted');
        await nvim.call('win_gotoid', [currentWinId]);
        window.showInformationMessage('Compiling Quarkdown...');
      }
    }),

    commands.registerCommand("coc-quarkdown.watch", async () => {
      const doc = await workspace.document;
      if (!doc || !doc.uri.startsWith('file')) {
        window.showErrorMessage("Current buffer is not a saved file.");
        return;
      }
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call('win_getid') as number;
        const path = Uri.parse(doc.uri).fsPath.replace(/ /g, '\\ ');
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown c ${path} -p -w`);
        lastTerminalBufnr = await nvim.call('bufnr', ['%']) as number;
        await nvim.command('setlocal nobuflisted');
        await nvim.call('win_gotoid', [currentWinId]);
        window.showInformationMessage('Watching Quarkdown...');
      }
    }),

    workspace.registerAutocmd({
      event: 'BufNewFile,BufRead',
      pattern: ['*.qd', '*.quarkdown'],
      callback: async () => {
        await nvim.command('setf quarkdown');
      }
    }),

    workspace.registerAutocmd({
      event: 'FileType',
      pattern: 'quarkdown',
      callback: async () => {
        await initializeBuffer();
      }
    }),

    listManager.registerList(new DemoList())
  );

  const serverOptions = { command: 'quarkdown', args: ['language-server'] };
  const clientOptions = {
    documentSelector: ['quarkdown', 'qd'],
    synchronize: { configurationSection: 'quarkdown' },
    rootPath: workspace.root || process.cwd()
  };

  const extConfig = workspace.getConfiguration('coc-quarkdown');
  if (extConfig.get<boolean>('enabled', true)) {
    const client = new LanguageClient('coc-quarkdown-lsp', 'Quarkdown LSP', serverOptions, clientOptions);
    context.subscriptions.push(services.registerLanguageClient(client));
  }

  const doc = await workspace.document;
  if (doc && (doc.filetype === 'quarkdown' || doc.filetype === 'qd')) {
    await initializeBuffer();
  }
}

// async function getCompletionItems(): Promise<CompleteResult> {
//   return {
//     items: [
//       { word: 'TestCompletionItem 1', menu: '[coc-quarkdown]' },
//     ],
//   };
// }
