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
      const isLoaded = await nvim.call('bufloaded', [bufnr]) as boolean;

      if (isLoaded) {
        await nvim.command(`bwipeout! ${bufnr}`);
        window.showInformationMessage('Quarkdown action stopped.');
      }
      lastTerminalBufnr = null;
    }
  };

  const config = workspace.getConfiguration('semanticTokens');
  const filetypes = config.get<string[]>('filetypes', []);
  if (!filetypes.includes('quarkdown')) {
    filetypes.push('quarkdown');
    config.update('filetypes', filetypes, true);
  }

  const highlights = [
    'hi default link CocSemFunction Function',
    'hi default link CocSemParameter Special', 
    'hi default link CocSemVariable Identifier',
    'hi default link CocSemType Type',
    'hi default link CocSemKeyword Keyword',
  ];

  const applyHighlights = async () => {
    for (const line of highlights) {
      await nvim.command(line);
    }
  };

  context.subscriptions.push(
    commands.registerCommand("coc-quarkdown.stop", stopAction),

    commands.registerCommand("coc-quarkdown.compile", async () => {
      const doc = await workspace.document;
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call('win_getid') as number;
        const path = Uri.parse(doc.uri).fsPath;

        await nvim.command(`botright 45vnew | setlocal noswapfile | terminal quarkdown c ${path}`);

        lastTerminalBufnr = await nvim.call('bufnr', ['$']) as number;

        await nvim.call('win_gotoid', [currentWinId]);
        window.showInformationMessage('Compiling Quarkdown...');
      }
    }),

    commands.registerCommand("coc-quarkdown.watch", async () => {
      const doc = await workspace.document;
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call('win_getid') as number;
        const path = Uri.parse(doc.uri).fsPath;

        await nvim.command(`botright 45vnew | setlocal noswapfile | terminal quarkdown compile -p -w ${path}`);

        lastTerminalBufnr = await nvim.call('bufnr', ['$']) as number;

        await nvim.call('win_gotoid', [currentWinId]);
        window.showInformationMessage('Watching Quarkdown...');
      }
    }),

    listManager.registerList(new DemoList())
  );

  const serverOptions = { command: 'quarkdown', args: ['language-server'] };
  const clientOptions = {
    documentSelector: ['quarkdown', 'qd'],
    synchronize: { configurationSection: 'quarkdown' }
  };
  const client = new LanguageClient('coc-quarkdown-lsp', 'Quarkdown LSP', serverOptions, clientOptions);

  context.subscriptions.push(
    services.registerLanguageClient(client),

    workspace.registerAutocmd({
      event: 'BufNewFile,BufRead',
      pattern: '*.qd,*.quarkdown',
      callback: async () => {
        await nvim.command('setf quarkdown');
      }
    }),

    workspace.registerAutocmd({
      event: 'FileType',
      pattern: 'quarkdown',
      callback: async () => {
        await applyHighlights();
        await nvim.command('nnoremap <buffer> <silent> <leader>mc :CocCommand coc-quarkdown.compile<CR>');
        await nvim.command('nnoremap <buffer> <silent> <leader>mw :CocCommand coc-quarkdown.watch<CR>');
        await nvim.command('nnoremap <buffer> <silent> <leader>ms :CocCommand coc-quarkdown.stop<CR>');
      }
    })
  );
}

// async function getCompletionItems(): Promise<CompleteResult> {
//   return {
//     items: [
//       { word: 'TestCompletionItem 1', menu: '[coc-quarkdown]' },
//     ],
//   };
// }
