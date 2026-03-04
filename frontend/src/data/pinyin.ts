export const initials = [
  '', 'b', 'p', 'm', 'f',
  'd', 't', 'n', 'l',
  'g', 'k', 'h',
  'j', 'q', 'x',
  'zh', 'ch', 'sh', 'r',
  'z', 'c', 's',
  'y', 'w',
] as const

export const finals = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ao', 'ou',
  'an', 'en', 'ang', 'eng', 'ong',
  'ia', 'ie', 'iu', 'iao', 'ian', 'in', 'iang', 'ing', 'iong',
  'ua', 'uo', 'ui', 'uai', 'uan', 'un', 'uang',
  'üe', 'üan', 'ün',
  'er',
] as const

// All valid pinyin syllable combinations. Entries not in this set are invalid.
const validSyllablesSet = new Set([
  'a','o','e','ai','ei','ao','ou','an','en','ang','eng','er',
  'ba','bo','bi','bu','bai','bei','bao','ban','ben','bang','beng','bie','biao','bian','bin','bing',
  'pa','po','pi','pu','pai','pei','pao','pou','pan','pen','pang','peng','pie','piao','pian','pin','ping',
  'ma','mo','me','mi','mu','mai','mei','mao','mou','man','men','mang','meng','mie','miu','miao','mian','min','ming',
  'fa','fo','fu','fei','fou','fan','fen','fang','feng',
  'da','de','di','du','dai','dei','dao','dou','dan','den','dang','deng','dong','dia','die','diu','diao','dian','ding','duo','dui','duan','dun',
  'ta','te','ti','tu','tai','tei','tao','tou','tan','tang','teng','tong','tie','tiao','tian','ting','tuo','tui','tuan','tun',
  'na','ne','ni','nu','nü','nai','nei','nao','nou','nan','nen','nang','neng','nong','nia','nie','niu','niao','nian','nin','niang','ning','nuo','nuan','nüe',
  'la','le','li','lu','lü','lai','lei','lao','lou','lan','lang','leng','long','lia','lie','liu','liao','lian','lin','liang','ling','luo','luan','lun','lüe',
  'ga','ge','gu','gai','gei','gao','gou','gan','gen','gang','geng','gong','gua','guo','gui','guai','guan','gun','guang',
  'ka','ke','ku','kai','kei','kao','kou','kan','ken','kang','keng','kong','kua','kuo','kui','kuai','kuan','kun','kuang',
  'ha','he','hu','hai','hei','hao','hou','han','hen','hang','heng','hong','hua','huo','hui','huai','huan','hun','huang',
  'ji','ju','jia','jie','jiu','jiao','jian','jin','jiang','jing','jiong','jue','juan','jun',
  'qi','qu','qia','qie','qiu','qiao','qian','qin','qiang','qing','qiong','que','quan','qun',
  'xi','xu','xia','xie','xiu','xiao','xian','xin','xiang','xing','xiong','xue','xuan','xun',
  'zha','zhe','zhi','zhu','zhai','zhei','zhao','zhou','zhan','zhen','zhang','zheng','zhong','zhua','zhuo','zhui','zhuai','zhuan','zhun','zhuang',
  'cha','che','chi','chu','chai','chao','chou','chan','chen','chang','cheng','chong','chua','chuo','chui','chuai','chuan','chun','chuang',
  'sha','she','shi','shu','shai','shei','shao','shou','shan','shen','shang','sheng','shua','shuo','shui','shuai','shuan','shun','shuang',
  're','ri','ru','rao','rou','ran','ren','rang','reng','rong','ruo','rui','ruan','run',
  'za','ze','zi','zu','zai','zei','zao','zou','zan','zen','zang','zeng','zong','zuo','zui','zuan','zun',
  'ca','ce','ci','cu','cai','cao','cou','can','cen','cang','ceng','cong','cuo','cui','cuan','cun',
  'sa','se','si','su','sai','sao','sou','san','sen','sang','seng','song','suo','sui','suan','sun',
  'ya','yo','ye','yi','yu','yai','yao','you','yan','yin','yang','ying','yong','yue','yuan','yun',
  'wa','wo','wu','wai','wei','wan','wen','wang','weng',
])

export function isValidSyllable(initial: string, final: string): boolean {
  const syllable = initial + final
  return validSyllablesSet.has(syllable)
}

export function getSyllable(initial: string, final: string): string {
  return initial + final
}

export function getAllValidSyllables(): string[] {
  return Array.from(validSyllablesSet).sort()
}

const toneMarks: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

// Apply a tone (1-4) to a pinyin syllable following standard tone placement rules:
// 1. If there is an 'a' or 'e', place the mark on it.
// 2. If there is 'ou', place the mark on the 'o'.
// 3. Otherwise, place the mark on the last vowel.
export function applyTone(syllable: string, tone: number): string {
  if (tone < 1 || tone > 4) return syllable

  const vowels = 'aeiouü'
  const idx = tone - 1

  if (syllable.includes('a')) {
    return syllable.replace('a', toneMarks['a'][idx])
  }
  if (syllable.includes('e')) {
    return syllable.replace('e', toneMarks['e'][idx])
  }
  if (syllable.includes('ou')) {
    return syllable.replace('o', toneMarks['o'][idx])
  }

  for (let i = syllable.length - 1; i >= 0; i--) {
    const ch = syllable[i]
    if (vowels.includes(ch) && toneMarks[ch]) {
      return syllable.substring(0, i) + toneMarks[ch][idx] + syllable.substring(i + 1)
    }
  }

  return syllable
}

export const toneColors = [
  'text-red-600',      // tone 1
  'text-orange-500',   // tone 2
  'text-green-600',    // tone 3
  'text-blue-600',     // tone 4
  'text-gray-500',     // tone 5 (neutral)
]

export const toneLabels = [
  'Tone 1 — flat (mā)',
  'Tone 2 — rising (má)',
  'Tone 3 — dipping (mǎ)',
  'Tone 4 — falling (mà)',
  'Neutral',
]
