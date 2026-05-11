"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(index_exports);
var import_coc2 = require("coc.nvim");

// src/lists.ts
var import_coc = require("coc.nvim");
var DemoList = class extends import_coc.BasicList {
  constructor() {
    super();
    this.name = "demo_list";
    this.description = "CocList for coc-quarkdown";
    this.defaultAction = "open";
    this.actions = [];
    this.addAction("open", (item) => {
      import_coc.window.showInformationMessage(`${item.label}, ${item.data.name}`);
    });
  }
  async loadItems(context) {
    return [
      {
        label: "coc-quarkdown list item 1",
        data: { name: "list item 1" }
      },
      {
        label: "coc-quarkdown list item 2",
        data: { name: "list item 2" }
      }
    ];
  }
};

// src/index.ts
async function activate(context) {
  const { nvim } = import_coc2.workspace;
  let lastTerminalBufnr = null;
  const stopAction = async () => {
    if (lastTerminalBufnr) {
      const bufnr = lastTerminalBufnr;
      const exists = await nvim.call("bufexists", [bufnr]);
      if (exists) {
        const winid = await nvim.call("bufwinid", [bufnr]);
        if (winid !== -1) {
          await nvim.call("win_execute", [winid, "close!"]);
        }
        await nvim.command(`silent! bwipeout! ${bufnr}`);
        import_coc2.window.showInformationMessage("Quarkdown action stopped.");
      }
      lastTerminalBufnr = null;
    }
  };
  const config = import_coc2.workspace.getConfiguration("semanticTokens");
  const filetypes = config.get("filetypes", []);
  if (!filetypes.includes("quarkdown")) {
    filetypes.push("quarkdown");
    config.update("filetypes", filetypes, true);
  }
  const highlights = [
    "hi default link CocSemFunction Function",
    "hi default link CocSemParameter Special",
    "hi default link CocSemVariable Identifier",
    "hi default link CocSemType Type",
    "hi default link CocSemKeyword Keyword"
  ];
  const applyHighlights = async () => {
    for (const line of highlights) {
      await nvim.command(line);
    }
  };
  context.subscriptions.push(
    import_coc2.commands.registerCommand("coc-quarkdown.stop", stopAction),
    import_coc2.commands.registerCommand("coc-quarkdown.stop", stopAction),
    import_coc2.commands.registerCommand("coc-quarkdown.compile", async () => {
      const doc = await import_coc2.workspace.document;
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call("win_getid");
        const path = import_coc2.Uri.parse(doc.uri).fsPath;
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown compile ${path}`);
        lastTerminalBufnr = await nvim.call("bufnr", ["%"]);
        await nvim.command("setlocal nobuflisted");
        await nvim.call("win_gotoid", [currentWinId]);
        import_coc2.window.showInformationMessage("Compiling Quarkdown...");
      }
    }),
    import_coc2.commands.registerCommand("coc-quarkdown.watch", async () => {
      const doc = await import_coc2.workspace.document;
      if (doc) {
        await stopAction();
        const currentWinId = await nvim.call("win_getid");
        const path = import_coc2.Uri.parse(doc.uri).fsPath;
        await nvim.command(`botright 45vnew | terminal ++curwin quarkdown compile -p -w ${path}`);
        lastTerminalBufnr = await nvim.call("bufnr", ["%"]);
        await nvim.command("setlocal nobuflisted");
        await nvim.call("win_gotoid", [currentWinId]);
        import_coc2.window.showInformationMessage("Watching Quarkdown...");
      }
    }),
    import_coc2.listManager.registerList(new DemoList())
  );
  const serverOptions = { command: "quarkdown", args: ["language-server"] };
  const clientOptions = {
    documentSelector: ["quarkdown", "qd"],
    synchronize: { configurationSection: "quarkdown" }
  };
  const client = new import_coc2.LanguageClient("coc-quarkdown-lsp", "Quarkdown LSP", serverOptions, clientOptions);
  context.subscriptions.push(
    import_coc2.services.registerLanguageClient(client),
    import_coc2.workspace.registerAutocmd({
      event: "BufNewFile,BufRead",
      pattern: "*.qd,*.quarkdown",
      callback: async () => {
        await nvim.command("setf quarkdown");
      }
    }),
    import_coc2.workspace.registerAutocmd({
      event: "FileType",
      pattern: "quarkdown",
      callback: async () => {
        await applyHighlights();
        await nvim.command("nnoremap <buffer> <silent> <leader>mc :CocCommand coc-quarkdown.compile<CR>");
        await nvim.command("nnoremap <buffer> <silent> <leader>mw :CocCommand coc-quarkdown.watch<CR>");
        await nvim.command("nnoremap <buffer> <silent> <leader>ms :CocCommand coc-quarkdown.stop<CR>");
      }
    })
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
