export interface TemplateVar {
  key?: string;   // to get text from map
  label?: string; // to render
  data?: any; // some data
}

export type TextTemplate = Array<string | TemplateVar>;
export type TTVarMap = Record<string, string | ((v: TemplateVar) => string)>;
export type GetTextArgs = {
  template: TextTemplate;
  map: TTVarMap;
} | {
  template: TextTemplate;
  getVar(ent: TemplateVar): string;
};

export function getTextFromTemplate(args: GetTextArgs) {
  const getVar = 'getVar' in args ? args.getVar : (ent: TemplateVar) => {
    const strOrFunc = args.map[ent.key];
    if (typeof strOrFunc == 'function')
      return `${strOrFunc(ent)}`;

    if (strOrFunc == null)
      return '';

    return `${strOrFunc}`;
  };

  return args.template.map(entOrStr => {
    if (typeof entOrStr == 'string')
      return entOrStr;

    return getVar(entOrStr);
  }).join('');
}
