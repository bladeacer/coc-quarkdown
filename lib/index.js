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
  const serverOptions = {
    command: "quarkdown",
    args: ["language-server"]
  };
  const clientOptions = {
    documentSelector: ["quarkdown", "qd"],
    synchronize: {
      configurationSection: "quarkdown"
    }
  };
  const client = new import_coc2.LanguageClient(
    "coc-quarkdown-lsp",
    "Quarkdown Language Server",
    serverOptions,
    clientOptions
  );
  context.subscriptions.push(
    import_coc2.services.registerLanguageClient(client),
    import_coc2.commands.registerCommand("coc-quarkdown.Command", async () => {
      import_coc2.window.showInformationMessage("coc-quarkdown Commands works!");
    }),
    import_coc2.listManager.registerList(new DemoList()),
    import_coc2.sources.createSource({
      name: "coc-quarkdown completion source",
      doComplete: async () => {
        return await getCompletionItems();
      }
    })
    // workspace.registerAutocmd({
    //   event: "InsertLeave",
    //   request: true,
    //   callback: () => {
    //     window.showInformationMessage("registerAutocmd on InsertLeave");
    //   }
    // })
  );
}
async function getCompletionItems() {
  return {
    items: [
      {
        word: "TestCompletionItem 1",
        menu: "[coc-quarkdown]"
      },
      {
        word: "TestCompletionItem 2",
        menu: "[coc-quarkdown]"
      }
    ]
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
