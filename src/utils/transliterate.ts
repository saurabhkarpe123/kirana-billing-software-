/**
 * Lightweight English-to-Marathi (Devanagari) phonetic transliterator
 * specifically tuned for Maharashtra customer names on 80mm receipts.
 */

const COMMON_WORDS: Record<string, string> = {
  cash: 'रोख',
  customer: 'ग्राहक',
  walkin: 'रोख',
  patil: 'पाटील',
  deshmukh: 'देशमुख',
  jadhav: 'जाधव',
  shinde: 'शिंदे',
  kulkarni: 'कुलकर्णी',
  joshi: 'जोशी',
  pawar: 'पवार',
  gaikwad: 'गायकवाड',
  more: 'मोरे',
  kadam: 'कदम',
  sawant: 'सावंत',
  chavan: 'चव्हाण',
  mane: 'माने',
  kale: 'काळे',
  karpe: 'कर्पे',
  bhosale: 'भोसले',
  salunkhe: 'साळुंखे',
  deshpande: 'देशपांडे',
  gokhale: 'गोखले',
  apte: 'आपटे',
  nikam: 'निकम',
  sonawane: 'सोनवणे',
  ahire: 'आहिरे',
  deore: 'देवरे',
  bhamre: 'भामरे',
  ramesh: 'रमेश',
  suresh: 'सुरेश',
  mahesh: 'महेश',
  ganesh: 'गणेश',
  rajesh: 'राजेश',
  dinesh: 'दिनेश',
  prakash: 'प्रकाश',
  sanjay: 'संजय',
  vijay: 'विजय',
  ajay: 'अजय',
  anil: 'अनिल',
  sunil: 'सुनिल',
  nitin: 'नितीन',
  sachin: 'सचिन',
  saurabh: 'सौरभ',
  rahul: 'राहुल',
  rohit: 'रोहित',
  amit: 'अमित',
  sumit: 'सुमित',
  amita: 'अमिता',
  sunita: 'सुनीता',
  anita: 'अनिता',
  kavita: 'कविता',
  savita: 'सविता',
  rekha: 'रेखा',
  meena: 'मीना',
  seema: 'सीमा',
  pooja: 'पूजा',
  priya: 'प्रिया',
  sneha: 'स्नेहा',
  neha: 'नेहा',
  asha: 'आशा',
  usha: 'उषा',
  kiran: 'किरण',
  deepak: 'दीपक',
  ashok: 'अशोक',
  vilas: 'विलास',
  suhas: 'सुहास',
  vikas: 'विकास',
  pramod: 'प्रमोद',
  vinod: 'विनोद',
  manoj: 'मनोज',
  santosh: 'संतोष',
  datta: 'दत्ता',
  dattatray: 'दत्तात्रय',
  ram: 'राम',
  shyam: 'श्याम',
  krishna: 'कृष्णा',
  ganpat: 'गणपत',
  shankar: 'शंकर',
  narayan: 'नारायण',
  baban: 'बबन',
  dada: 'दादा',
  kaka: 'काका',
  mama: 'मामा',
  tai: 'ताई',
  bai: 'बाई',
  ji: 'जी',
  rao: 'राव',
  saheb: 'साहेब',
  radha: 'राधा',
  smita: 'स्मिता',
  nisha: 'निशा',
  varsha: 'वर्षा',
  meera: 'मीरा',
  geeta: 'गीता',
  gita: 'गीता',
  lata: 'लता',
  sagar: 'सागर',
  amol: 'अमोल',
  tushar: 'तुषार',
  swapnil: 'स्वप्नील',
  mayur: 'मयूर',
  akshay: 'अक्षय',
  shubham: 'शुभम',
  vaibhav: 'वैभव',
  prasad: 'प्रसाद',
  kailas: 'कैलास',
  balaji: 'बालाजी',
  pandurang: 'पांडुरंग',
  tukaram: 'तुकाराम',
  vitthal: 'विठ्ठल',
  shantaram: 'शांताराम',
};

const CONSONANTS: Array<[string, string]> = [
  ['ksh', 'क्ष'],
  ['dny', 'ज्ञ'],
  ['gny', 'ज्ञ'],
  ['shr', 'श्र'],
  ['chh', 'छ'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['ng', 'ंग'],
  ['ny', 'ञ'],
  ['tr', 'त्र'],
  ['k', 'क'],
  ['g', 'ग'],
  ['c', 'क'],
  ['j', 'ज'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['z', 'झ'],
  ['q', 'क'],
  ['x', 'क्स'],
];

const INDEPENDENT_VOWELS: Array<[string, string]> = [
  ['aa', 'आ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['ee', 'ई'],
  ['oo', 'ऊ'],
  ['ou', 'औ'],
  ['a', 'अ'],
  ['i', 'इ'],
  ['u', 'उ'],
  ['e', 'ए'],
  ['o', 'ओ'],
];

const MATRAS: Array<[string, string]> = [
  ['aa', 'ा'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['ou', 'ौ'],
  ['a', ''],
  ['i', 'ि'],
  ['u', 'ु'],
  ['e', 'े'],
  ['o', 'ो'],
];

function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function transliterateWord(rawWord: string): string {
  if (!rawWord) return '';
  if (isDevanagari(rawWord)) return rawWord;

  const clean = rawWord.toLowerCase();
  if (COMMON_WORDS[clean]) {
    return COMMON_WORDS[clean];
  }

  // Keep numbers/punctuation intact
  if (/^[0-9.,\-/#()+]+$/.test(rawWord)) {
    return rawWord;
  }

  let out = '';
  let i = 0;

  while (i < clean.length) {
    const rest = clean.slice(i);

    // Check consonant match first
    let matchedConsonant: [string, string] | null = null;
    for (const entry of CONSONANTS) {
      if (rest.startsWith(entry[0])) {
        matchedConsonant = entry;
        break;
      }
    }

    if (matchedConsonant) {
      const [cKey, cChar] = matchedConsonant;
      i += cKey.length;
      const afterConsonant = clean.slice(i);

      // Handle nasal 'n' or 'm' before another consonant as anusvara (ं)
      if (
        (cKey === 'n' || cKey === 'm') &&
        out.length > 0 &&
        afterConsonant.length > 0 &&
        !/^[aeiou]/.test(afterConsonant)
      ) {
        out += 'ं';
        continue;
      }

      // Check vowel matra right after consonant
      let matchedMatra: [string, string] | null = null;
      for (const mEntry of MATRAS) {
        if (afterConsonant.startsWith(mEntry[0])) {
          matchedMatra = mEntry;
          break;
        }
      }

      if (matchedMatra) {
        const isTrailingLongA =
          matchedMatra[0] === 'a' &&
          clean.length > 2 &&
          i + matchedMatra[0].length === clean.length;
        out += cChar + (isTrailingLongA ? 'ा' : matchedMatra[1]);
        i += matchedMatra[0].length;
      } else {
        // Consonant cluster (halant) if followed by another consonant mid-word
        const nextIsConsonant =
          afterConsonant.length > 0 &&
          /^[bcdfghjklmnpqrstvwxyz]/.test(afterConsonant) &&
          i < clean.length - 1;
        out += nextIsConsonant ? `${cChar}्` : cChar;
      }
      continue;
    }

    // Check independent vowel
    let matchedVowel: [string, string] | null = null;
    for (const vEntry of INDEPENDENT_VOWELS) {
      if (rest.startsWith(vEntry[0])) {
        matchedVowel = vEntry;
        break;
      }
    }

    if (matchedVowel) {
      out += matchedVowel[1];
      i += matchedVowel[0].length;
      continue;
    }

    // Fallback: keep character as-is
    out += rawWord[i] || '';
    i += 1;
  }

  return out;
}

export function toMarathiReceiptName(nameMr?: string, nameEn?: string): string {
  const mr = (nameMr || '').trim();
  const en = (nameEn || '').trim();

  if (mr && isDevanagari(mr)) {
    return mr;
  }

  const source = mr || en;
  if (!source) return 'रोख ग्राहक';

  if (source.toLowerCase() === 'cash customer') {
    return 'रोख ग्राहक';
  }

  return source
    .split(/\s+/)
    .map((word) => transliterateWord(word))
    .join(' ');
}
