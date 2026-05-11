import { 
  commands, CompleteResult, ExtensionContext, listManager, sources, window, workspace, 
  services, LanguageClient 
} from 'coc.nvim';
import DemoList from './lists';

export async function activate(context: ExtensionContext): Promise<void> {
  const { nvim } = workspace;

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

  const serverOptions = { command: 'quarkdown', args: ['language-server'] };
  const clientOptions = {
    documentSelector: ['quarkdown', 'qd'],
    synchronize: { configurationSection: 'quarkdown' }
  };
  const client = new LanguageClient('coc-quarkdown-lsp', 'Quarkdown LSP', serverOptions, clientOptions);

  context.subscriptions.push(
    services.registerLanguageClient(client),

    // sources.createSource({
    //   name: "coc-quarkdown completion source",
    //   doComplete: async () => {
    //     return await getCompletionItems();
    //   }
    // }),

    commands.registerCommand("coc-quarkdown.compile", async () => {
      const doc = await workspace.document;
      if (doc) {
        const path = doc.uri.replace('file://', '');
        await nvim.command(`split | terminal quarkdown c ${path}`);
      }
    }),

    commands.registerCommand("coc-quarkdown.watch", async () => {
      const doc = await workspace.document;
      if (doc) {
        const path = doc.uri.replace('file://', '');
        await nvim.command(`split | terminal quarkdown -p -w ${path}`);
      }
    }),

    listManager.registerList(new DemoList()),

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
        // Cross-compatible buffer-local keybinds
        await nvim.command('nnoremap <buffer> <silent> <leader>qc :CocCommand coc-quarkdown.compile<CR>');
        await nvim.command('nnoremap <buffer> <silent> <leader>qw :CocCommand coc-quarkdown.watch<CR>');
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
