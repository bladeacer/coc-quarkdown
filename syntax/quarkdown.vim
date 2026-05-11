if exists("b:current_syntax")
  finish
endif

syn match qdComment /\/\/.*/
syn region qdString start=/"/ skip=/\\"/ end=/"/
syn match qdNumber /\<\d\+\>/
syn match qdOperator /[:=+\-*\/]/
syn keyword qdBoolean true false

hi def link qdComment Comment
hi def link qdString String
hi def link qdNumber Constant
hi def link qdOperator Statement
hi def link qdBoolean Boolean

let b:current_syntax = "quarkdown"
