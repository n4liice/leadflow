/**
 * Processa um texto com spintext e substitui variáveis
 * Exemplo: "{Olá|Oi} {{nome}}, tudo bem?" -> "Olá João, tudo bem?"
 */
export function processSpintext(text: string, variables: Record<string, string> = {}): string {
  // Primeiro, processa as variantes de spintext {opção1|opção2|opção3}
  let result = text.replace(/\{([^{}]+)\}/g, (match, options) => {
    // Ignora se for uma variável de template {{var}}
    if (match.startsWith('{{')) return match;
    
    const choices = options.split('|');
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  });

  // Depois, substitui as variáveis de template {{variável}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });

  return result;
}

/**
 * Valida a sintaxe do spintext
 */
export function validateSpintext(text: string): { valid: boolean; error?: string } {
  // Verifica se há chaves não fechadas
  let braceCount = 0;
  for (const char of text) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      return { valid: false, error: "Chave de fechamento sem abertura correspondente" };
    }
  }

  if (braceCount !== 0) {
    return { valid: false, error: "Chaves não balanceadas" };
  }

  // Verifica se há variáveis com apenas uma chave (ex: {nome} ao invés de {{nome}})
  // Padrão: encontra {palavra} que NÃO seja {{palavra}} e NÃO contenha | (spintext)
  const singleBraceVarRegex = /(?<!\{)\{(\w+)\}(?!\})/g;
  const invalidVars: string[] = [];
  let match;

  while ((match = singleBraceVarRegex.exec(text)) !== null) {
    // Ignora se for spintext (contém |)
    if (!match[1].includes('|')) {
      invalidVars.push(match[1]);
    }
  }

  if (invalidVars.length > 0) {
    return {
      valid: false,
      error: `Variáveis devem usar chaves duplas: ${invalidVars.map(v => `{${v}} → {{${v}}}`).join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Extrai todas as variáveis de template do texto
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Extrai todas as opções de spintext do texto
 */
export function extractSpintextOptions(text: string): string[][] {
  const regex = /\{([^{}|]+(?:\|[^{}|]+)+)\}/g;
  const options: string[][] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    options.push(match[1].split('|'));
  }
  
  return options;
}
