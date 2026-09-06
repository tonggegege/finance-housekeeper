import { DEFAULT_CATEGORIES } from './types';

/** 类别别名：用户怎么叫都行，最后归一到清单分类 */
const ALIAS: Record<string, string> = {
  滴滴: '打车',
  出租车: '打车',
  的士: '打车',
  打滴: '打车',
  网约车: '打车',
  地铁: '交通',
  公交: '交通',
  高铁: '交通',
  火车: '交通',
  加油: '交通',
  停车: '交通',
  午饭: '外卖',
  晚餐: '外卖',
  午餐: '外卖',
  晚饭: '外卖',
  早饭: '外卖',
  早餐: '外卖',
  吃饭: '外卖',
  点餐: '外卖',
  咖啡: '奶茶',
  饮料: '奶茶',
  饮品: '奶茶',
  果茶: '奶茶',
  甜品: '奶茶',
  聚会: '聚餐',
  请客: '聚餐',
  饭局: '聚餐',
  请吃饭: '聚餐',
  衣服: '服饰',
  裤子: '服饰',
  鞋子: '服饰',
  鞋: '服饰',
  化妆品: '服饰',
  其他: '杂物',
  杂项: '杂物',
  日用: '杂物',
};

/** 从“今天花了吧”这类噪音里把动词/助词剔掉 */
const NOISE = /(今天|昨天|前天|刚刚|刚才|又|还|了|的|花|买|吃|喝|付|用|花销|消费|支出|开销|一笔|一下|记|记账)/g;

function normalizeCategory(token: string): string {
  const raw = token.trim();
  if (!raw) return '杂物';
  if (ALIAS[raw]) return ALIAS[raw];

  for (const known of DEFAULT_CATEGORIES) {
    if (raw.includes(known)) return known;
  }

  const cleaned = raw.replace(NOISE, '').trim();
  if (!cleaned) return '杂物';
  if (ALIAS[cleaned]) return ALIAS[cleaned];
  for (const known of DEFAULT_CATEGORIES) {
    if (cleaned.includes(known)) return known;
  }
  return cleaned.slice(0, 6);
}

export interface ParsedEntry {
  category: string;
  amount: number;
}

export interface ParsedReport {
  /** 识别出的消费条目 */
  entries: ParsedEntry[];
  /** 识别出的预算设置（如「预算8000」） */
  budget?: number;
  /** 识别出的必存金额（如「先存2000」） */
  mustSave?: number;
}

const ENTRY_RE = /([\u4e00-\u9fa5A-Za-z]{1,8})\s*(\d+(?:\.\d{1,2})?)\s*(?:块钱|块|元|rmb|RMB)?/g;

/**
 * 解析用户的一句话报账，例如：
 * 「打车20」「奶茶 18 外卖35」「今天聚餐花了260」「预算8000」「先存2000」
 */
export function parseReport(text: string): ParsedReport {
  const result: ParsedReport = { entries: [] };

  // 预算 / 必存
  const budgetMatch = text.match(/(?:预算|可支配|总额|总共)\s*(?:是|为|改成|改成|调到|设为|设置)?\s*(\d+(?:\.\d{1,2})?)/);
  if (budgetMatch) result.budget = Number(budgetMatch[1]);

  const saveMatch = text.match(/(?:必存|先存|要存|得存|存钱|存款|强制储蓄|存)\s*(?:是|为|改成|调到|设为|设置)?\s*(\d+(?:\.\d{1,2})?)/);
  if (saveMatch) result.mustSave = Number(saveMatch[1]);

  // 预算 / 必存的数字不算消费，先从文本里摘掉再解析条目
  let rest = text;
  if (budgetMatch) rest = rest.replace(budgetMatch[0], ' ');
  if (saveMatch) rest = rest.replace(saveMatch[0], ' ');

  let m: RegExpExecArray | null;
  ENTRY_RE.lastIndex = 0;
  while ((m = ENTRY_RE.exec(rest)) !== null) {
    const category = normalizeCategory(m[1]);
    const amount = Number(m[2]);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999) continue;
    result.entries.push({ category, amount });
  }

  return result;
}

export function formatMoney(n: number, withSymbol = true): string {
  const fixed = Math.abs(n).toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? '-' : ''}${withSymbol ? '¥' : ''}${fixed}`;
}
