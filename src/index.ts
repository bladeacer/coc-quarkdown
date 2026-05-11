import { 
  commands, CompleteResult, ExtensionContext, listManager, sources, window, workspace,
  services, LanguageClient
} from 'coc.nvim';
import DemoList from './lists';

export async function activate(context: ExtensionContext): Promise<void> {
  const serverOptions = {
    command: 'quarkdown',
    args: ['language-server']
  };

  const clientOptions = {
    documentSelector: ['quarkdown', 'qd'],
    synchronize: {
      configurationSection: 'quarkdown'
    }
  };

  const client = new LanguageClient(
    'coc-quarkdown-lsp',
    'Quarkdown Language Server',
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(
    services.registerLanguageClient(client),

    commands.registerCommand("coc-quarkdown.Command", async () => {
      window.showInformationMessage("coc-quarkdown Commands works!");
    }),

    listManager.registerList(new DemoList()),

    sources.createSource({
      name: "coc-quarkdown completion source",
      doComplete: async () => {
        return await getCompletionItems();
      }
    }),

    // workspace.registerAutocmd({
    //   event: "InsertLeave",
    //   request: true,
    //   callback: () => {
    //     window.showInformationMessage("registerAutocmd on InsertLeave");
    //   }
    // })
  );
}

async function getCompletionItems(): Promise<CompleteResult> {
  return {
    items: [
      {
        word: 'TestCompletionItem 1',
        menu: '[coc-quarkdown]',
      },
      {
        word: 'TestCompletionItem 2',
        menu: '[coc-quarkdown]',
      },
    ],
  };
}
