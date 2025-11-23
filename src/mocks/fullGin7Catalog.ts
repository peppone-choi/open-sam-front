import rawCatalog from './gin7-command-catalog.json';
import { Gin7AuthorityCard, Gin7CommandCatalog } from '@/types/gin7';
import { CommandType } from '@/types/logh';

function mapGroupToCommandType(group?: string): CommandType {
  switch (group) {
    case 'operation':
    case 'command':
    case 'logistics':
    case 'tactical':
      return 'tactics';
    case 'personal':
    case 'personnel':
    case 'political':
    case 'intelligence':
      return 'personnel';
    default:
      return 'personnel';
  }
}

const rawCatalogAny = rawCatalog as any;

const hydratedShortcuts = (rawCatalogAny.shortcuts || []).map((shortcut: any) => {
  const commandGroup = shortcut.commandCode ? rawCatalogAny.commands?.[shortcut.commandCode]?.group : undefined;
  return {
    ...shortcut,
    type: mapGroupToCommandType(commandGroup),
  };
});

export const fullGin7Catalog: Gin7CommandCatalog = {
  version: rawCatalogAny.version,
  source: rawCatalogAny.source,
  generatedAt: rawCatalogAny.generatedAt,
  commands: rawCatalogAny.commands,
  authorityCards: rawCatalogAny.authorityCards,
  shortcuts: hydratedShortcuts,
};

export function buildAuthorityCardView(templateId: string, faction: 'empire' | 'alliance' | 'shared' = 'alliance'): Gin7AuthorityCard {
  const template = fullGin7Catalog.authorityCards.find((card) => card.templateId === templateId);
  if (!template) {
    throw new Error(`template ${templateId} not found in gin7 catalog`);
  }

  const commandMeta = template.commandCodes
    .map((code) => fullGin7Catalog.commands[code])
    .filter((meta): meta is NonNullable<typeof meta> => Boolean(meta));

  const shortcuts = fullGin7Catalog.shortcuts.filter((shortcut) => {
    return shortcut.commandCode ? template.commandCodes.includes(shortcut.commandCode) : false;
  });

  return {
    id: `${template.templateId}:${faction}`,
    templateId: template.templateId,
    title: template.title,
    rank: template.minRank ?? '장교',
    faction: faction === 'shared' ? 'alliance' : faction,
    commands: template.commandCodes as CommandType[],
    commandCodes: template.commandCodes,
    commandMeta,
    shortcuts,
  };
}

export const sampleAuthorityCards = fullGin7Catalog.authorityCards.slice(0, 5);
export const sampleAuthorityCardViews = sampleAuthorityCards.map((card, index) =>
  buildAuthorityCardView(card.templateId, index % 2 === 0 ? 'alliance' : 'empire')
);
