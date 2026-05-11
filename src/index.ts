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

  const setupDefaultKeymaps = async () => {
    const maps = [
      { key: '<leader>mc', cmd: 'coc-quarkdown.compile' },
      { key: '<leader>mw', cmd: 'coc-quarkdown.watch' },
      { key: '<leader>ms', cmd: 'coc-quarkdown.stop' },
    ];

    for (const map of maps) {
      const hasMapping = await nvim.call('maparg', [map.key, 'n']) as string;
      if (!hasMapping) {
        await nvim.command(`nnoremap <buffer> <silent> ${map.key} :CocCommand ${map.cmd}<CR>`);
      }
    }
  };

  const config = workspace.getConfiguration('semanticTokens');
  const filetypes = config.get<string[]>('filetypes', []);
  if (!filetypes.includes('quarkdown')) {
    filetypes.push('quarkdown');
    config.update('filetypes', filetypes, true);
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
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown compile ${path}`);
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
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown compile -p -w ${path}`);
        lastTerminalBufnr = await nvim.call('bufnr', ['%']) as number;
        await nvim.command('setlocal nobuflisted');
        await nvim.call('win_gotoid', [currentWinId]);
        window.showInformationMessage('Watching Quarkdown...');
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

  if (config.get<boolean>('enabled', true)) {
    const client = new LanguageClient('coc-quarkdown-lsp', 'Quarkdown LSP', serverOptions, clientOptions);
    context.subscriptions.push(services.registerLanguageClient(client));
  }

  context.subscriptions.push(
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
        await setupDefaultKeymaps();
      }
    })
  );

  const currentDoc = await workspace.document;
  if (currentDoc && (currentDoc.filetype === 'quarkdown' || currentDoc.filetype === 'qd')) {
    await applyHighlights();
    await setupDefaultKeymaps();
  }
}

// async function getCompletionItems(): Promise<CompleteResult> {
//   return {
//     items: [
//       { word: 'TestCompletionItem 1', menu: '[coc-quarkdown]' },
//     ],
//   };
// }
