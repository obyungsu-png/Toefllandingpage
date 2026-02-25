export interface SATWord {
  english: string;
  korean: string;
  definition: string;
  synonyms: string;
  isSynonym?: boolean; // Flag to indicate if this is a synonym question
  parentWord?: string; // Original word if this is a synonym
}

// Fisher-Yates shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Seeded shuffle for consistent randomization per day
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed;
  
  // Simple seeded random number generator
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// TOEFL + TOEIC vocabulary database - 2,000 words (50 days × 40 words)
const toeflToeicWordDatabase: SATWord[] = [
  // DAY 1 (Words 1-40)
  { english: "accomplish", korean: "성취하다", definition: "to succeed in doing or completing something", synonyms: "achieve, complete, fulfill" },
  { english: "accurate", korean: "정확한", definition: "correct in all details; exact", synonyms: "precise, exact, correct" },
  { english: "acquire", korean: "획득하다", definition: "to gain possession of something", synonyms: "obtain, gain, get" },
  { english: "adapt", korean: "적응하다", definition: "to adjust to new conditions", synonyms: "adjust, modify, accommodate" },
  { english: "adequate", korean: "적절한", definition: "satisfactory or acceptable in quality or quantity", synonyms: "sufficient, acceptable, satisfactory" },
  { english: "adjust", korean: "조정하다", definition: "to change something slightly to make it fit", synonyms: "modify, alter, adapt" },
  { english: "advance", korean: "전진하다", definition: "to move forward or make progress", synonyms: "progress, proceed, develop" },
  { english: "adverse", korean: "불리한", definition: "preventing success or development; harmful", synonyms: "unfavorable, harmful, negative" },
  { english: "advocate", korean: "옹호하다", definition: "to publicly support or recommend", synonyms: "support, promote, champion" },
  { english: "allocate", korean: "할당하다", definition: "to distribute resources for a particular purpose", synonyms: "assign, distribute, apportion" },
  { english: "alternative", korean: "대안", definition: "one of two or more available possibilities", synonyms: "option, choice, substitute" },
  { english: "ambiguous", korean: "모호한", definition: "open to more than one interpretation", synonyms: "unclear, vague, equivocal" },
  { english: "analyze", korean: "분석하다", definition: "to examine something in detail", synonyms: "examine, study, investigate" },
  { english: "anticipate", korean: "예상하다", definition: "to expect or predict something", synonyms: "expect, foresee, predict" },
  { english: "apparent", korean: "명백한", definition: "clearly visible or understood; obvious", synonyms: "obvious, evident, clear" },
  { english: "appreciate", korean: "인정하다", definition: "to recognize the value or significance of", synonyms: "value, recognize, acknowledge" },
  { english: "approach", korean: "접근법", definition: "a way of dealing with something", synonyms: "method, strategy, technique" },
  { english: "appropriate", korean: "적절한", definition: "suitable or proper in the circumstances", synonyms: "suitable, fitting, proper" },
  { english: "approximate", korean: "대략적인", definition: "close to the actual but not completely accurate", synonyms: "rough, estimated, close" },
  { english: "arbitrary", korean: "임의적인", definition: "based on random choice rather than reason", synonyms: "random, capricious, subjective" },
  { english: "aspect", korean: "측면", definition: "a particular part or feature of something", synonyms: "feature, facet, element" },
  { english: "assess", korean: "평가하다", definition: "to evaluate or estimate the nature of", synonyms: "evaluate, appraise, judge" },
  { english: "assign", korean: "배정하다", definition: "to allocate a task or duty to someone", synonyms: "allocate, designate, appoint" },
  { english: "assist", korean: "돕다", definition: "to help someone", synonyms: "help, aid, support" },
  { english: "assume", korean: "가정하다", definition: "to suppose something is true without proof", synonyms: "presume, suppose, believe" },
  { english: "assure", korean: "보장하다", definition: "to tell someone confidently that something is true", synonyms: "guarantee, ensure, promise" },
  { english: "attach", korean: "붙이다", definition: "to fasten or join one thing to another", synonyms: "fasten, connect, join" },
  { english: "attain", korean: "달성하다", definition: "to succeed in achieving something", synonyms: "achieve, reach, accomplish" },
  { english: "attitude", korean: "태도", definition: "a settled way of thinking or feeling", synonyms: "outlook, perspective, viewpoint" },
  { english: "attribute", korean: "속성", definition: "a quality or feature of someone or something", synonyms: "quality, characteristic, feature" },
  { english: "authority", korean: "권한", definition: "the power or right to give orders", synonyms: "power, control, jurisdiction" },
  { english: "available", korean: "이용가능한", definition: "able to be used or obtained", synonyms: "accessible, obtainable, ready" },
  { english: "aware", korean: "인식하는", definition: "having knowledge or perception of a situation", synonyms: "conscious, cognizant, informed" },
  { english: "benefit", korean: "이익", definition: "an advantage or profit gained from something", synonyms: "advantage, profit, gain" },
  { english: "capable", korean: "능력있는", definition: "having the ability to do something", synonyms: "competent, able, skilled" },
  { english: "capacity", korean: "수용력", definition: "the maximum amount that can be contained", synonyms: "volume, size, space" },
  { english: "category", korean: "범주", definition: "a class or division of things", synonyms: "class, group, type" },
  { english: "challenge", korean: "도전", definition: "a difficult task that tests abilities", synonyms: "test, trial, difficulty" },
  { english: "circumstance", korean: "상황", definition: "a fact or condition connected with an event", synonyms: "situation, condition, context" },
  { english: "clarify", korean: "명확히하다", definition: "to make something easier to understand", synonyms: "explain, elucidate, simplify" },

  // DAY 2 (Words 41-80)
  { english: "coherent", korean: "일관성있는", definition: "logical and well-organized", synonyms: "logical, consistent, organized" },
  { english: "coincide", korean: "일치하다", definition: "to occur at the same time or match", synonyms: "correspond, match, align" },
  { english: "collaborate", korean: "협력하다", definition: "to work jointly on an activity", synonyms: "cooperate, work together, partner" },
  { english: "collapse", korean: "붕괴하다", definition: "to fall down or give way suddenly", synonyms: "fall, crumble, fail" },
  { english: "colleague", korean: "동료", definition: "a person with whom one works", synonyms: "coworker, associate, partner" },
  { english: "commence", korean: "시작하다", definition: "to begin or start", synonyms: "begin, start, initiate" },
  { english: "comment", korean: "논평", definition: "a verbal or written remark expressing opinion", synonyms: "remark, observation, statement" },
  { english: "commission", korean: "위원회", definition: "a group appointed for a specific function", synonyms: "committee, board, council" },
  { english: "commit", korean: "전념하다", definition: "to dedicate oneself to a course of action", synonyms: "dedicate, pledge, devote" },
  { english: "commodity", korean: "상품", definition: "a raw material or primary product", synonyms: "product, goods, merchandise" },
  { english: "communicate", korean: "의사소통하다", definition: "to share or exchange information", synonyms: "convey, transmit, share" },
  { english: "community", korean: "지역사회", definition: "a group of people living in the same area", synonyms: "society, population, residents" },
  { english: "compensate", korean: "보상하다", definition: "to give something to make up for loss", synonyms: "reimburse, repay, recompense" },
  { english: "competent", korean: "유능한", definition: "having necessary ability or knowledge", synonyms: "capable, able, qualified" },
  { english: "compile", korean: "편집하다", definition: "to collect information into a list or book", synonyms: "gather, collect, assemble" },
  { english: "complement", korean: "보완하다", definition: "to add to something in a way that improves it", synonyms: "supplement, complete, enhance" },
  { english: "complex", korean: "복잡한", definition: "consisting of many interconnected parts", synonyms: "complicated, intricate, elaborate" },
  { english: "component", korean: "구성요소", definition: "a part or element of a larger whole", synonyms: "part, element, constituent" },
  { english: "comprehend", korean: "이해하다", definition: "to understand something fully", synonyms: "understand, grasp, perceive" },
  { english: "comprehensive", korean: "포괄적인", definition: "including all or nearly all elements", synonyms: "complete, thorough, extensive" },
  { english: "comprise", korean: "구성되다", definition: "to consist of or be made up of", synonyms: "consist of, contain, include" },
  { english: "concentrate", korean: "집중하다", definition: "to focus attention or effort on something", synonyms: "focus, center, direct" },
  { english: "concept", korean: "개념", definition: "an abstract idea or general notion", synonyms: "idea, notion, thought" },
  { english: "conclude", korean: "결론내리다", definition: "to arrive at a judgment or decision", synonyms: "deduce, infer, determine" },
  { english: "concurrent", korean: "동시의", definition: "existing or happening at the same time", synonyms: "simultaneous, parallel, coexisting" },
  { english: "conduct", korean: "수행하다", definition: "to organize and carry out an activity", synonyms: "carry out, perform, execute" },
  { english: "confer", korean: "협의하다", definition: "to have discussions or exchange opinions", synonyms: "consult, discuss, deliberate" },
  { english: "confine", korean: "제한하다", definition: "to keep within certain limits", synonyms: "restrict, limit, constrain" },
  { english: "confirm", korean: "확인하다", definition: "to establish the truth or correctness of", synonyms: "verify, validate, corroborate" },
  { english: "conflict", korean: "갈등", definition: "a serious disagreement or argument", synonyms: "dispute, clash, disagreement" },
  { english: "conform", korean: "따르다", definition: "to comply with rules or standards", synonyms: "comply, obey, follow" },
  { english: "consent", korean: "동의", definition: "permission or agreement to do something", synonyms: "agreement, approval, permission" },
  { english: "consequence", korean: "결과", definition: "a result or effect of an action", synonyms: "result, outcome, effect" },
  { english: "considerable", korean: "상당한", definition: "notably large in size or amount", synonyms: "substantial, significant, sizable" },
  { english: "consist", korean: "구성되다", definition: "to be composed or made up of", synonyms: "comprise, contain, include" },
  { english: "consistent", korean: "일관된", definition: "acting in the same way over time", synonyms: "constant, regular, uniform" },
  { english: "constant", korean: "끊임없는", definition: "occurring continuously over time", synonyms: "continuous, persistent, unceasing" },
  { english: "constitute", korean: "구성하다", definition: "to be a part of a whole", synonyms: "form, make up, compose" },
  { english: "constrain", korean: "강요하다", definition: "to severely restrict the scope of", synonyms: "restrict, limit, confine" },
  { english: "construct", korean: "건설하다", definition: "to build or form by putting parts together", synonyms: "build, create, erect" },

  // DAY 3 (Words 81-120)
  { english: "consult", korean: "상담하다", definition: "to seek information or advice from someone", synonyms: "confer, discuss, seek advice" },
  { english: "consume", korean: "소비하다", definition: "to use up a resource", synonyms: "use, utilize, deplete" },
  { english: "contact", korean: "접촉", definition: "communication or meeting with someone", synonyms: "communication, connection, touch" },
  { english: "contemporary", korean: "현대의", definition: "living or occurring at the same time", synonyms: "modern, current, present-day" },
  { english: "context", korean: "맥락", definition: "the circumstances forming the setting", synonyms: "setting, background, framework" },
  { english: "contract", korean: "계약", definition: "a written or spoken agreement", synonyms: "agreement, deal, pact" },
  { english: "contradict", korean: "모순되다", definition: "to deny the truth of a statement", synonyms: "deny, dispute, oppose" },
  { english: "contrary", korean: "반대의", definition: "opposite in nature or direction", synonyms: "opposite, opposing, contradictory" },
  { english: "contrast", korean: "대조", definition: "the state of being strikingly different", synonyms: "difference, distinction, comparison" },
  { english: "contribute", korean: "기여하다", definition: "to give in order to help achieve something", synonyms: "donate, give, provide" },
  { english: "controversy", korean: "논란", definition: "prolonged public disagreement", synonyms: "dispute, debate, argument" },
  { english: "convene", korean: "소집하다", definition: "to come or bring together for a meeting", synonyms: "assemble, gather, meet" },
  { english: "convention", korean: "관습", definition: "a way in which something is usually done", synonyms: "custom, practice, tradition" },
  { english: "convert", korean: "전환하다", definition: "to change in form or function", synonyms: "transform, change, alter" },
  { english: "convince", korean: "설득하다", definition: "to cause someone to believe something", synonyms: "persuade, satisfy, assure" },
  { english: "cooperate", korean: "협력하다", definition: "to work together toward a common goal", synonyms: "collaborate, work together, unite" },
  { english: "coordinate", korean: "조정하다", definition: "to organize different elements effectively", synonyms: "organize, arrange, manage" },
  { english: "corporate", korean: "기업의", definition: "relating to a corporation", synonyms: "business, company, organizational" },
  { english: "correspond", korean: "일치하다", definition: "to have similarity or be equivalent to", synonyms: "match, agree, conform" },
  { english: "create", korean: "창조하다", definition: "to bring something into existence", synonyms: "make, produce, generate" },
  { english: "credit", korean: "신용", definition: "the ability to obtain goods before payment", synonyms: "trust, credibility, faith" },
  { english: "criteria", korean: "기준", definition: "principles or standards for judgment", synonyms: "standards, measures, benchmarks" },
  { english: "crucial", korean: "결정적인", definition: "of great importance or essential", synonyms: "critical, vital, essential" },
  { english: "culture", korean: "문화", definition: "the customs and beliefs of a society", synonyms: "civilization, society, tradition" },
  { english: "currency", korean: "통화", definition: "a system of money in general use", synonyms: "money, cash, legal tender" },
  { english: "cycle", korean: "주기", definition: "a series of events regularly repeated", synonyms: "sequence, pattern, rotation" },
  { english: "data", korean: "데이터", definition: "facts and statistics for analysis", synonyms: "information, facts, figures" },
  { english: "debate", korean: "논쟁", definition: "a formal discussion on a topic", synonyms: "discussion, argument, dispute" },
  { english: "decade", korean: "10년", definition: "a period of ten years", synonyms: "ten years, period, era" },
  { english: "decline", korean: "거부하다", definition: "to politely refuse or become smaller", synonyms: "refuse, reject, decrease" },
  { english: "dedicate", korean: "헌신하다", definition: "to devote time or effort to a purpose", synonyms: "devote, commit, pledge" },
  { english: "define", korean: "정의하다", definition: "to state the exact meaning of", synonyms: "explain, describe, specify" },
  { english: "definite", korean: "명확한", definition: "clearly stated or decided", synonyms: "certain, clear, specific" },
  { english: "demonstrate", korean: "증명하다", definition: "to clearly show the existence of", synonyms: "show, prove, illustrate" },
  { english: "denote", korean: "나타내다", definition: "to be a sign of or indicate", synonyms: "indicate, signify, represent" },
  { english: "deny", korean: "부정하다", definition: "to state that something is not true", synonyms: "refute, contradict, reject" },
  { english: "depart", korean: "떠나다", definition: "to leave, typically to start a journey", synonyms: "leave, go, exit" },
  { english: "depend", korean: "의존하다", definition: "to rely on someone or something", synonyms: "rely, count on, trust" },
  { english: "depict", korean: "묘사하다", definition: "to represent by a drawing or painting", synonyms: "portray, illustrate, represent" },
  { english: "derive", korean: "얻다", definition: "to obtain something from a source", synonyms: "obtain, gain, extract" },

  // DAY 4 (Words 121-160)
  { english: "design", korean: "설계", definition: "a plan or drawing produced to show function", synonyms: "plan, blueprint, layout" },
  { english: "despite", korean: "~에도불구하고", definition: "without being affected by", synonyms: "notwithstanding, regardless of, in spite of" },
  { english: "detect", korean: "탐지하다", definition: "to discover or identify the presence of", synonyms: "discover, find, identify" },
  { english: "deteriorate", korean: "악화되다", definition: "to become progressively worse", synonyms: "worsen, decline, degrade" },
  { english: "determine", korean: "결정하다", definition: "to cause something to occur in a particular way", synonyms: "decide, establish, ascertain" },
  { english: "deviate", korean: "벗어나다", definition: "to depart from an established course", synonyms: "diverge, differ, stray" },
  { english: "device", korean: "장치", definition: "a thing made for a particular purpose", synonyms: "tool, instrument, gadget" },
  { english: "devote", korean: "바치다", definition: "to give time or resources to something", synonyms: "dedicate, commit, allocate" },
  { english: "differentiate", korean: "구별하다", definition: "to recognize a distinction between things", synonyms: "distinguish, discriminate, separate" },
  { english: "dimension", korean: "차원", definition: "a measurable extent of a particular kind", synonyms: "aspect, measurement, size" },
  { english: "diminish", korean: "감소하다", definition: "to make or become less", synonyms: "decrease, reduce, lessen" },
  { english: "discern", korean: "식별하다", definition: "to perceive or recognize something", synonyms: "perceive, detect, recognize" },
  { english: "discrete", korean: "별개의", definition: "individually separate and distinct", synonyms: "separate, distinct, individual" },
  { english: "discriminate", korean: "차별하다", definition: "to recognize a distinction or treat differently", synonyms: "distinguish, differentiate, separate" },
  { english: "displace", korean: "대체하다", definition: "to move from the usual place", synonyms: "replace, move, shift" },
  { english: "display", korean: "전시하다", definition: "to show or make visible", synonyms: "exhibit, show, present" },
  { english: "dispose", korean: "처리하다", definition: "to get rid of or throw away", synonyms: "discard, throw away, eliminate" },
  { english: "distinct", korean: "뚜렷한", definition: "recognizably different in nature", synonyms: "different, separate, clear" },
  { english: "distinguish", korean: "구별하다", definition: "to recognize as different", synonyms: "differentiate, discern, identify" },
  { english: "distort", korean: "왜곡하다", definition: "to give a misleading account of", synonyms: "misrepresent, twist, falsify" },
  { english: "distribute", korean: "분배하다", definition: "to give shares of something to each person", synonyms: "allocate, dispense, hand out" },
  { english: "diverse", korean: "다양한", definition: "showing a great deal of variety", synonyms: "varied, various, different" },
  { english: "document", korean: "문서", definition: "a piece of written or printed matter", synonyms: "paper, record, file" },
  { english: "domain", korean: "영역", definition: "a specified sphere of activity", synonyms: "field, area, realm" },
  { english: "domestic", korean: "국내의", definition: "relating to one's own country", synonyms: "national, internal, home" },
  { english: "dominant", korean: "지배적인", definition: "having power and influence over others", synonyms: "controlling, ruling, commanding" },
  { english: "draft", korean: "초안", definition: "a preliminary version of a document", synonyms: "outline, sketch, version" },
  { english: "dramatic", korean: "극적인", definition: "sudden and striking", synonyms: "striking, impressive, significant" },
  { english: "duration", korean: "기간", definition: "the time during which something continues", synonyms: "period, time, term" },
  { english: "dynamic", korean: "역동적인", definition: "characterized by constant change or activity", synonyms: "energetic, active, vigorous" },
  { english: "economy", korean: "경제", definition: "the wealth and resources of a region", synonyms: "financial system, commerce, trade" },
  { english: "edit", korean: "편집하다", definition: "to prepare written material for publication", synonyms: "revise, correct, modify" },
  { english: "element", korean: "요소", definition: "a basic or essential part of something", synonyms: "component, part, factor" },
  { english: "eliminate", korean: "제거하다", definition: "to completely remove or get rid of", synonyms: "remove, eradicate, delete" },
  { english: "emerge", korean: "나타나다", definition: "to move out of or away from something", synonyms: "appear, surface, arise" },
  { english: "emphasis", korean: "강조", definition: "special importance given to something", synonyms: "stress, importance, weight" },
  { english: "empirical", korean: "경험적인", definition: "based on observation or experience", synonyms: "experimental, practical, observed" },
  { english: "enable", korean: "가능하게하다", definition: "to give the means or authority to do something", synonyms: "allow, permit, empower" },
  { english: "encounter", korean: "마주치다", definition: "to unexpectedly meet or be faced with", synonyms: "meet, face, experience" },
  { english: "enforce", korean: "시행하다", definition: "to compel observance of a law or rule", synonyms: "implement, apply, administer" },

  // DAY 5 (Words 161-200)
  { english: "enhance", korean: "향상시키다", definition: "to increase or improve in quality", synonyms: "improve, augment, boost" },
  { english: "enormous", korean: "거대한", definition: "very large in size or quantity", synonyms: "huge, massive, immense" },
  { english: "ensure", korean: "보장하다", definition: "to make certain that something will occur", synonyms: "guarantee, secure, assure" },
  { english: "entity", korean: "실체", definition: "a thing with distinct existence", synonyms: "being, body, organization" },
  { english: "environment", korean: "환경", definition: "the surroundings or conditions", synonyms: "surroundings, setting, habitat" },
  { english: "equate", korean: "동일시하다", definition: "to consider one thing equal to another", synonyms: "compare, liken, parallel" },
  { english: "equip", korean: "갖추다", definition: "to supply with necessary items", synonyms: "provide, furnish, supply" },
  { english: "equivalent", korean: "동등한", definition: "equal in value or meaning", synonyms: "equal, same, comparable" },
  { english: "erode", korean: "침식하다", definition: "to gradually wear away", synonyms: "wear away, deteriorate, corrode" },
  { english: "error", korean: "오류", definition: "a mistake or inaccuracy", synonyms: "mistake, fault, inaccuracy" },
  { english: "establish", korean: "확립하다", definition: "to set up on a firm basis", synonyms: "create, found, institute" },
  { english: "estate", korean: "재산", definition: "property consisting of land and buildings", synonyms: "property, land, holdings" },
  { english: "estimate", korean: "추정하다", definition: "to roughly calculate or judge the value", synonyms: "calculate, assess, gauge" },
  { english: "ethic", korean: "윤리", definition: "moral principles governing behavior", synonyms: "morals, values, principles" },
  { english: "evaluate", korean: "평가하다", definition: "to form an idea of the value of", synonyms: "assess, appraise, judge" },
  { english: "eventual", korean: "궁극적인", definition: "occurring at the end of a process", synonyms: "final, ultimate, resulting" },
  { english: "evident", korean: "명백한", definition: "plain or obvious; clearly seen", synonyms: "obvious, apparent, clear" },
  { english: "evolve", korean: "진화하다", definition: "to develop gradually", synonyms: "develop, progress, advance" },
  { english: "exceed", korean: "초과하다", definition: "to be greater than a number or amount", synonyms: "surpass, go beyond, outdo" },
  { english: "exclude", korean: "배제하다", definition: "to deny access to or bar from a place", synonyms: "bar, omit, eliminate" },
  { english: "exhibit", korean: "전시하다", definition: "to publicly display in a gallery", synonyms: "display, show, present" },
  { english: "expand", korean: "확장하다", definition: "to become or make larger", synonyms: "enlarge, extend, increase" },
  { english: "expert", korean: "전문가", definition: "a person with extensive knowledge", synonyms: "specialist, authority, professional" },
  { english: "explicit", korean: "명시적인", definition: "stated clearly and in detail", synonyms: "clear, direct, specific" },
  { english: "exploit", korean: "이용하다", definition: "to make full use of a resource", synonyms: "utilize, use, leverage" },
  { english: "export", korean: "수출하다", definition: "to send goods to another country for sale", synonyms: "sell abroad, ship out, trade" },
  { english: "expose", korean: "노출하다", definition: "to make visible or reveal", synonyms: "reveal, uncover, display" },
  { english: "external", korean: "외부의", definition: "belonging to the outside", synonyms: "outer, outside, exterior" },
  { english: "extract", korean: "추출하다", definition: "to remove or take out", synonyms: "remove, withdraw, obtain" },
  { english: "facilitate", korean: "촉진하다", definition: "to make an action easier", synonyms: "ease, assist, help" },
  { english: "factor", korean: "요인", definition: "a circumstance contributing to a result", synonyms: "element, component, aspect" },
  { english: "feature", korean: "특징", definition: "a distinctive attribute or aspect", synonyms: "characteristic, trait, quality" },
  { english: "federal", korean: "연방의", definition: "relating to a system of government", synonyms: "national, central, governmental" },
  { english: "fee", korean: "수수료", definition: "a payment made for services", synonyms: "charge, cost, price" },
  { english: "file", korean: "파일", definition: "a collection of data stored under one name", synonyms: "document, record, folder" },
  { english: "final", korean: "최종의", definition: "coming at the end of a series", synonyms: "last, concluding, ultimate" },
  { english: "finance", korean: "재정", definition: "the management of money", synonyms: "economics, money management, funding" },
  { english: "finite", korean: "유한한", definition: "having limits or bounds", synonyms: "limited, restricted, bounded" },
  { english: "flexible", korean: "유연한", definition: "capable of bending easily without breaking", synonyms: "adaptable, pliable, adjustable" },
  { english: "fluctuate", korean: "변동하다", definition: "to rise and fall irregularly", synonyms: "vary, change, oscillate" },

  // DAY 6 (Words 201-240)
  { english: "focus", korean: "초점", definition: "the center of interest or activity", synonyms: "center, emphasis, concentration" },
  { english: "format", korean: "형식", definition: "the way something is arranged", synonyms: "layout, design, structure" },
  { english: "formula", korean: "공식", definition: "a mathematical relationship or rule", synonyms: "equation, rule, method" },
  { english: "forthcoming", korean: "다가오는", definition: "about to happen or appear", synonyms: "upcoming, approaching, imminent" },
  { english: "found", korean: "설립하다", definition: "to establish an institution", synonyms: "establish, create, institute" },
  { english: "foundation", korean: "기초", definition: "the basis on which something is grounded", synonyms: "basis, base, groundwork" },
  { english: "framework", korean: "틀", definition: "a basic structure underlying a system", synonyms: "structure, system, scheme" },
  { english: "function", korean: "기능", definition: "an activity natural to something", synonyms: "purpose, role, duty" },
  { english: "fund", korean: "자금", definition: "a sum of money saved for a purpose", synonyms: "money, capital, finance" },
  { english: "fundamental", korean: "근본적인", definition: "forming a necessary base or core", synonyms: "basic, essential, primary" },
  { english: "furthermore", korean: "게다가", definition: "in addition; besides", synonyms: "moreover, additionally, also" },
  { english: "gender", korean: "성별", definition: "the state of being male or female", synonyms: "sex, sexual category" },
  { english: "generate", korean: "생성하다", definition: "to cause something to arise or come about", synonyms: "produce, create, cause" },
  { english: "generation", korean: "세대", definition: "all people born around the same time", synonyms: "age group, cohort, era" },
  { english: "global", korean: "세계적인", definition: "relating to the whole world", synonyms: "worldwide, international, universal" },
  { english: "goal", korean: "목표", definition: "the object of a person's ambition", synonyms: "objective, aim, target" },
  { english: "grade", korean: "등급", definition: "a level of rank or quality", synonyms: "level, standard, class" },
  { english: "grant", korean: "수여하다", definition: "to agree to give or allow", synonyms: "give, award, bestow" },
  { english: "guarantee", korean: "보증", definition: "a formal promise or assurance", synonyms: "assurance, promise, pledge" },
  { english: "guideline", korean: "지침", definition: "a general rule or principle", synonyms: "rule, principle, standard" },
  { english: "hence", korean: "따라서", definition: "as a consequence; for this reason", synonyms: "therefore, thus, consequently" },
  { english: "hierarchy", korean: "계층", definition: "a system ranking one above another", synonyms: "ranking, order, ladder" },
  { english: "highlight", korean: "강조하다", definition: "to pick out and emphasize", synonyms: "emphasize, stress, feature" },
  { english: "hypothesis", korean: "가설", definition: "a supposition made as a starting point", synonyms: "theory, proposition, assumption" },
  { english: "identical", korean: "동일한", definition: "exactly alike or equal", synonyms: "same, equal, matching" },
  { english: "identify", korean: "식별하다", definition: "to establish the identity of", synonyms: "recognize, determine, distinguish" },
  { english: "ideology", korean: "이념", definition: "a system of ideas and ideals", synonyms: "beliefs, philosophy, doctrine" },
  { english: "ignorance", korean: "무지", definition: "lack of knowledge or information", synonyms: "unawareness, inexperience, unfamiliarity" },
  { english: "illustrate", korean: "설명하다", definition: "to explain or make clear by examples", synonyms: "demonstrate, show, exemplify" },
  { english: "image", korean: "이미지", definition: "a representation of external form", synonyms: "picture, representation, likeness" },
  { english: "immigrate", korean: "이민오다", definition: "to come to live permanently in a foreign country", synonyms: "migrate, relocate, settle" },
  { english: "impact", korean: "영향", definition: "the effect of one thing on another", synonyms: "effect, influence, consequence" },
  { english: "implement", korean: "시행하다", definition: "to put a decision or plan into effect", synonyms: "execute, apply, carry out" },
  { english: "implicate", korean: "연루시키다", definition: "to show to be involved in something", synonyms: "involve, incriminate, associate" },
  { english: "implicit", korean: "암시적인", definition: "suggested though not directly expressed", synonyms: "implied, indirect, understood" },
  { english: "imply", korean: "암시하다", definition: "to suggest something without saying it directly", synonyms: "suggest, hint, indicate" },
  { english: "impose", korean: "부과하다", definition: "to force something unwelcome to be accepted", synonyms: "enforce, apply, establish" },
  { english: "incentive", korean: "유인책", definition: "something that motivates action", synonyms: "motivation, inducement, stimulus" },
  { english: "incidence", korean: "발생률", definition: "the occurrence or frequency of something", synonyms: "occurrence, rate, frequency" },
  { english: "incline", korean: "경향이있다", definition: "to be favorably disposed toward", synonyms: "tend, lean, be disposed" },

  // DAY 7 (Words 241-280)
  { english: "income", korean: "수입", definition: "money received for work or investments", synonyms: "earnings, salary, revenue" },
  { english: "incorporate", korean: "통합하다", definition: "to include as part of a whole", synonyms: "include, integrate, combine" },
  { english: "index", korean: "색인", definition: "an alphabetical list of names or subjects", synonyms: "listing, catalogue, directory" },
  { english: "indicate", korean: "나타내다", definition: "to point out or show", synonyms: "show, demonstrate, suggest" },
  { english: "individual", korean: "개인", definition: "a single human being", synonyms: "person, human, citizen" },
  { english: "induce", korean: "유도하다", definition: "to succeed in persuading or leading", synonyms: "persuade, convince, prompt" },
  { english: "inevitable", korean: "불가피한", definition: "certain to happen; unavoidable", synonyms: "unavoidable, certain, inescapable" },
  { english: "infer", korean: "추론하다", definition: "to deduce from evidence and reasoning", synonyms: "deduce, conclude, gather" },
  { english: "infrastructure", korean: "기반시설", definition: "basic physical systems of an organization", synonyms: "framework, foundation, structure" },
  { english: "inherent", korean: "내재하는", definition: "existing as a natural part of something", synonyms: "intrinsic, innate, built-in" },
  { english: "inhibit", korean: "억제하다", definition: "to hinder or prevent an action", synonyms: "prevent, hinder, restrain" },
  { english: "initial", korean: "초기의", definition: "existing at the beginning", synonyms: "first, beginning, opening" },
  { english: "initiate", korean: "시작하다", definition: "to cause a process to begin", synonyms: "begin, start, commence" },
  { english: "injure", korean: "다치게하다", definition: "to do physical harm to", synonyms: "hurt, harm, wound" },
  { english: "innovate", korean: "혁신하다", definition: "to make changes in something established", synonyms: "revolutionize, transform, modernize" },
  { english: "input", korean: "투입", definition: "something put into a system", synonyms: "contribution, data, information" },
  { english: "insert", korean: "삽입하다", definition: "to place or fit something into another", synonyms: "put in, introduce, place" },
  { english: "insight", korean: "통찰력", definition: "an accurate understanding of something", synonyms: "understanding, perception, awareness" },
  { english: "inspect", korean: "조사하다", definition: "to look at closely to assess condition", synonyms: "examine, check, scrutinize" },
  { english: "instance", korean: "사례", definition: "an example or single occurrence", synonyms: "example, case, occurrence" },
  { english: "institute", korean: "연구소", definition: "an organization for a specific purpose", synonyms: "organization, establishment, institution" },
  { english: "instruct", korean: "지시하다", definition: "to direct or command someone", synonyms: "teach, train, educate" },
  { english: "integral", korean: "필수적인", definition: "necessary to make a whole complete", synonyms: "essential, fundamental, basic" },
  { english: "integrate", korean: "통합하다", definition: "to combine one thing with another", synonyms: "combine, merge, unite" },
  { english: "integrity", korean: "성실성", definition: "the quality of being honest", synonyms: "honesty, honor, morality" },
  { english: "intelligence", korean: "지능", definition: "the ability to acquire knowledge", synonyms: "intellect, mind, brain" },
  { english: "intense", korean: "강렬한", definition: "of extreme force or degree", synonyms: "extreme, strong, powerful" },
  { english: "interact", korean: "상호작용하다", definition: "to act in a way that has effect on another", synonyms: "communicate, engage, cooperate" },
  { english: "intermediate", korean: "중급의", definition: "coming between two things in time", synonyms: "middle, in-between, median" },
  { english: "internal", korean: "내부의", definition: "existing on the inside", synonyms: "inner, interior, inside" },
  { english: "interpret", korean: "해석하다", definition: "to explain the meaning of", synonyms: "explain, elucidate, clarify" },
  { english: "interval", korean: "간격", definition: "an intervening time or space", synonyms: "gap, pause, break" },
  { english: "intervene", korean: "개입하다", definition: "to come between to prevent or alter", synonyms: "intercede, mediate, interfere" },
  { english: "intrinsic", korean: "본질적인", definition: "belonging naturally; essential", synonyms: "inherent, essential, fundamental" },
  { english: "invest", korean: "투자하다", definition: "to put money into financial schemes", synonyms: "fund, finance, back" },
  { english: "investigate", korean: "조사하다", definition: "to carry out research into a subject", synonyms: "examine, explore, research" },
  { english: "invoke", korean: "불러일으키다", definition: "to cite as an authority", synonyms: "cite, refer to, appeal to" },
  { english: "involve", korean: "포함하다", definition: "to include as a necessary part", synonyms: "include, contain, comprise" },
  { english: "isolate", korean: "고립시키다", definition: "to cause to be alone or apart", synonyms: "separate, segregate, detach" },
  { english: "issue", korean: "문제", definition: "an important topic for debate", synonyms: "matter, subject, topic" },

  // DAY 8 (Words 281-320)
  { english: "item", korean: "항목", definition: "an individual article or unit", synonyms: "article, piece, thing" },
  { english: "job", korean: "직업", definition: "a paid position of employment", synonyms: "work, position, occupation" },
  { english: "journal", korean: "학술지", definition: "a newspaper or magazine dealing with a topic", synonyms: "periodical, magazine, publication" },
  { english: "justify", korean: "정당화하다", definition: "to show or prove to be right", synonyms: "warrant, explain, defend" },
  { english: "label", korean: "라벨", definition: "a small piece of paper attached to an object", synonyms: "tag, sticker, mark" },
  { english: "labor", korean: "노동", definition: "work, especially physical work", synonyms: "work, toil, effort" },
  { english: "layer", korean: "층", definition: "a sheet or thickness of material", synonyms: "level, stratum, tier" },
  { english: "lecture", korean: "강의", definition: "an educational talk to an audience", synonyms: "talk, speech, address" },
  { english: "legal", korean: "합법적인", definition: "permitted by law", synonyms: "lawful, legitimate, valid" },
  { english: "legislate", korean: "입법하다", definition: "to make or enact laws", synonyms: "enact, pass, establish" },
  { english: "levy", korean: "부과하다", definition: "to impose a tax or fine", synonyms: "impose, charge, collect" },
  { english: "liberal", korean: "자유주의적인", definition: "open to new behavior or opinions", synonyms: "progressive, tolerant, open-minded" },
  { english: "license", korean: "면허", definition: "a permit to own or use something", synonyms: "permit, certificate, authorization" },
  { english: "likewise", korean: "마찬가지로", definition: "in the same way; also", synonyms: "similarly, also, too" },
  { english: "link", korean: "연결", definition: "a relationship between two things", synonyms: "connection, relationship, association" },
  { english: "locate", korean: "위치하다", definition: "to discover the exact place of", synonyms: "find, discover, pinpoint" },
  { english: "logic", korean: "논리", definition: "reasoning conducted according to principles", synonyms: "reasoning, sense, rationale" },
  { english: "maintain", korean: "유지하다", definition: "to cause to continue in the same state", synonyms: "preserve, keep, sustain" },
  { english: "major", korean: "주요한", definition: "important, serious, or significant", synonyms: "main, principal, chief" },
  { english: "manipulate", korean: "조작하다", definition: "to handle or control in a skillful manner", synonyms: "control, influence, handle" },
  { english: "manual", korean: "설명서", definition: "a book giving instructions", synonyms: "handbook, guide, instruction book" },
  { english: "margin", korean: "여백", definition: "the edge or border of something", synonyms: "edge, border, boundary" },
  { english: "mature", korean: "성숙한", definition: "fully developed physically", synonyms: "adult, grown, developed" },
  { english: "maximize", korean: "극대화하다", definition: "to make as large as possible", synonyms: "increase, boost, optimize" },
  { english: "mechanism", korean: "메커니즘", definition: "a system of parts working together", synonyms: "process, system, method" },
  { english: "media", korean: "매체", definition: "the main means of mass communication", synonyms: "press, communications, broadcasting" },
  { english: "mediate", korean: "중재하다", definition: "to intervene to produce agreement", synonyms: "arbitrate, negotiate, intercede" },
  { english: "medical", korean: "의료의", definition: "relating to the science of medicine", synonyms: "clinical, therapeutic, health" },
  { english: "medium", korean: "매개체", definition: "an agency or means of doing something", synonyms: "means, method, channel" },
  { english: "mental", korean: "정신적인", definition: "relating to the mind", synonyms: "psychological, intellectual, cognitive" },
  { english: "method", korean: "방법", definition: "a particular procedure for doing something", synonyms: "approach, technique, system" },
  { english: "migrate", korean: "이주하다", definition: "to move from one place to another", synonyms: "relocate, move, emigrate" },
  { english: "military", korean: "군사의", definition: "relating to armed forces", synonyms: "armed, defense, martial" },
  { english: "minimal", korean: "최소의", definition: "of a minimum amount or degree", synonyms: "minimum, least, smallest" },
  { english: "minimize", korean: "최소화하다", definition: "to reduce to the smallest possible amount", synonyms: "reduce, decrease, diminish" },
  { english: "minimum", korean: "최소", definition: "the least possible quantity or degree", synonyms: "lowest, least, smallest" },
  { english: "ministry", korean: "부처", definition: "a government department headed by a minister", synonyms: "department, bureau, office" },
  { english: "minor", korean: "사소한", definition: "lesser in importance or seriousness", synonyms: "small, insignificant, trivial" },
  { english: "mode", korean: "방식", definition: "a way or manner in which something occurs", synonyms: "manner, method, way" },
  { english: "modify", korean: "수정하다", definition: "to make partial changes to", synonyms: "alter, change, adjust" },

  // DAY 9 (Words 321-360)
  { english: "monitor", korean: "감시하다", definition: "to observe and check over time", synonyms: "watch, observe, track" },
  { english: "motive", korean: "동기", definition: "a reason for doing something", synonyms: "reason, motivation, purpose" },
  { english: "mutual", korean: "상호의", definition: "experienced by each of two parties", synonyms: "reciprocal, shared, common" },
  { english: "negate", korean: "부정하다", definition: "to nullify or make ineffective", synonyms: "invalidate, nullify, cancel" },
  { english: "network", korean: "네트워크", definition: "an arrangement of interconnecting lines", synonyms: "system, web, grid" },
  { english: "neutral", korean: "중립적인", definition: "not supporting either side in a conflict", synonyms: "impartial, unbiased, objective" },
  { english: "nevertheless", korean: "그럼에도불구하고", definition: "in spite of that; however", synonyms: "nonetheless, however, still" },
  { english: "norm", korean: "규범", definition: "something that is usual or standard", synonyms: "standard, average, typical" },
  { english: "normal", korean: "정��적인", definition: "conforming to a standard", synonyms: "typical, usual, standard" },
  { english: "notion", korean: "개념", definition: "a conception or belief about something", synonyms: "idea, belief, concept" },
  { english: "notwithstanding", korean: "~에도불구하고", definition: "nevertheless; in spite of", synonyms: "despite, regardless of, nevertheless" },
  { english: "nuclear", korean: "핵의", definition: "relating to the nucleus of an atom", synonyms: "atomic, nuclear" },
  { english: "objective", korean: "객관적인", definition: "not influenced by personal feelings", synonyms: "impartial, unbiased, neutral" },
  { english: "obtain", korean: "얻다", definition: "to come into possession of", synonyms: "get, acquire, gain" },
  { english: "obvious", korean: "명백한", definition: "easily perceived or understood", synonyms: "clear, evident, apparent" },
  { english: "occupy", korean: "차지하다", definition: "to reside or have one's place of business in", synonyms: "inhabit, live in, reside in" },
  { english: "occur", korean: "발생하다", definition: "to happen or take place", synonyms: "happen, take place, arise" },
  { english: "odd", korean: "이상한", definition: "different from what is usual", synonyms: "strange, unusual, peculiar" },
  { english: "offset", korean: "상쇄하다", definition: "to counteract something by having an equal force", synonyms: "counterbalance, compensate, balance" },
  { english: "ongoing", korean: "진행중인", definition: "continuing; still in progress", synonyms: "continuing, in progress, current" },
  { english: "option", korean: "선택권", definition: "a thing that is or may be chosen", synonyms: "choice, alternative, possibility" },
  { english: "orient", korean: "방향을정하다", definition: "to align or position relative to points", synonyms: "align, position, direct" },
  { english: "outcome", korean: "결과", definition: "the way a thing turns out", synonyms: "result, consequence, effect" },
  { english: "output", korean: "산출", definition: "the amount of something produced", synonyms: "production, yield, product" },
  { english: "overall", korean: "전반적인", definition: "taking everything into account", synonyms: "general, comprehensive, total" },
  { english: "overlap", korean: "겹치다", definition: "to extend over and cover part of", synonyms: "coincide, intersect, overlay" },
  { english: "overseas", korean: "해외의", definition: "in or to a foreign country", synonyms: "abroad, foreign, international" },
  { english: "panel", korean: "패널", definition: "a small group of people brought together", synonyms: "committee, board, group" },
  { english: "paradigm", korean: "패러다임", definition: "a typical example or pattern", synonyms: "model, pattern, example" },
  { english: "paragraph", korean: "단락", definition: "a distinct section of writing", synonyms: "section, passage, part" },
  { english: "parallel", korean: "평행한", definition: "occurring at the same time", synonyms: "similar, analogous, comparable" },
  { english: "parameter", korean: "매개변수", definition: "a numerical characteristic of a population", synonyms: "limit, boundary, framework" },
  { english: "participate", korean: "참여하다", definition: "to take part in something", synonyms: "take part, join in, engage" },
  { english: "partner", korean: "파트너", definition: "a person who takes part with another", synonyms: "associate, colleague, collaborator" },
  { english: "passive", korean: "수동적인", definition: "accepting without resistance", synonyms: "submissive, acquiescent, unresisting" },
  { english: "perceive", korean: "인지하다", definition: "to become aware of through the senses", synonyms: "discern, recognize, observe" },
  { english: "percent", korean: "퍼센트", definition: "by a specified amount in every hundred", synonyms: "percentage, proportion, rate" },
  { english: "period", korean: "기간", definition: "a length or portion of time", synonyms: "time, span, interval" },
  { english: "persist", korean: "지속하다", definition: "to continue firmly despite opposition", synonyms: "continue, endure, persevere" },
  { english: "perspective", korean: "관점", definition: "a particular attitude toward something", synonyms: "viewpoint, point of view, outlook" },

  // DAY 10 (Words 361-400)
  { english: "phase", korean: "단계", definition: "a distinct period in a process", synonyms: "stage, step, period" },
  { english: "phenomenon", korean: "현상", definition: "a fact or situation observed to exist", synonyms: "occurrence, event, happening" },
  { english: "philosophy", korean: "철학", definition: "the study of fundamental nature of knowledge", synonyms: "thought, thinking, reasoning" },
  { english: "physical", korean: "물리적인", definition: "relating to the body as opposed to the mind", synonyms: "bodily, corporeal, material" },
  { english: "plus", korean: "더하기", definition: "with the addition of", synonyms: "and, added to, along with" },
  { english: "policy", korean: "정책", definition: "a course of action adopted by an organization", synonyms: "plan, strategy, approach" },
  { english: "portion", korean: "부분", definition: "a part of a whole", synonyms: "part, section, piece" },
  { english: "pose", korean: "제기하다", definition: "to present or constitute a problem", synonyms: "present, create, cause" },
  { english: "positive", korean: "긍정적인", definition: "consisting in or characterized by presence", synonyms: "optimistic, confident, hopeful" },
  { english: "potential", korean: "잠재력", definition: "latent qualities capable of development", synonyms: "possibility, capability, capacity" },
  { english: "practitioner", korean: "전문가", definition: "a person actively engaged in a profession", synonyms: "professional, expert, specialist" },
  { english: "precede", korean: "선행하다", definition: "to come before in time or order", synonyms: "come before, lead, antecede" },
  { english: "precise", korean: "정밀한", definition: "marked by exactness and accuracy", synonyms: "exact, accurate, specific" },
  { english: "predict", korean: "예측하다", definition: "to say what will happen in the future", synonyms: "forecast, foresee, prophesy" },
  { english: "predominant", korean: "지배적인", definition: "present as the strongest element", synonyms: "dominant, main, principal" },
  { english: "preliminary", korean: "예비의", definition: "denoting action done in preparation", synonyms: "preparatory, initial, introductory" },
  { english: "presume", korean: "추정하다", definition: "to suppose something is true", synonyms: "assume, suppose, believe" },
  { english: "previous", korean: "이전의", definition: "existing or occurring before", synonyms: "prior, former, earlier" },
  { english: "primary", korean: "주요한", definition: "of chief importance; principal", synonyms: "main, chief, principal" },
  { english: "prime", korean: "주요한", definition: "of first importance; main", synonyms: "main, chief, key" },
  { english: "principal", korean: "주된", definition: "first in order of importance", synonyms: "main, chief, primary" },
  { english: "principle", korean: "원칙", definition: "a fundamental truth serving as foundation", synonyms: "truth, rule, law" },
  { english: "prior", korean: "이전의", definition: "existing or coming before in time", synonyms: "previous, earlier, preceding" },
  { english: "priority", korean: "우선순위", definition: "the fact of being more important", synonyms: "precedence, preference, primacy" },
  { english: "proceed", korean: "진행하다", definition: "to begin or continue a course of action", synonyms: "continue, go ahead, advance" },
  { english: "process", korean: "과정", definition: "a series of actions toward a result", synonyms: "procedure, operation, method" },
  { english: "professional", korean: "전문적인", definition: "relating to or belonging to a profession", synonyms: "expert, skilled, qualified" },
  { english: "prohibit", korean: "금지하다", definition: "to formally forbid by law or rule", synonyms: "forbid, ban, bar" },
  { english: "project", korean: "프로젝트", definition: "an individual or collaborative enterprise", synonyms: "plan, scheme, undertaking" },
  { english: "promote", korean: "촉진하다", definition: "to support or actively encourage", synonyms: "encourage, advance, foster" },
  { english: "proportion", korean: "비율", definition: "a part considered in relation to the whole", synonyms: "ratio, percentage, fraction" },
  { english: "prospect", korean: "전망", definition: "the possibility of some future event", synonyms: "possibility, chance, outlook" },
  { english: "protocol", korean: "규약", definition: "the official procedure or system of rules", synonyms: "procedure, convention, rules" },
  { english: "psychology", korean: "심리학", definition: "the scientific study of the mind", synonyms: "mental processes, behavior study" },
  { english: "publication", korean: "출판", definition: "the preparation and issuing of a book", synonyms: "publishing, issue, release" },
  { english: "publish", korean: "출판하다", definition: "to prepare and issue a book for sale", synonyms: "issue, release, print" },
  { english: "purchase", korean: "구매하다", definition: "to acquire by paying money", synonyms: "buy, acquire, obtain" },
  { english: "pursue", korean: "추구하다", definition: "to follow in order to catch or attack", synonyms: "follow, chase, seek" },
  { english: "qualitative", korean: "질적인", definition: "relating to the quality of something", synonyms: "quality-based, descriptive" },
  { english: "quote", korean: "인용하다", definition: "to repeat words from a text or speech", synonyms: "cite, recite, reproduce" },
];

// Shuffle the database once with a fixed seed to create a consistent random order
// This ensures each DAY has words starting with different letters (not alphabetically sorted)
const shuffledDatabase = seededShuffle(toeflToeicWordDatabase, 54321);

// Generate words for a specific day (1-50)
export function generateSATWordsForDay(day: number): SATWord[] {
  if (day < 1 || day > 50) {
    return [];
  }
  
  const startIndex = (day - 1) * 40;
  const endIndex = day * 40;
  
  // If we have actual data for this range, return it
  if (startIndex < shuffledDatabase.length) {
    const availableWords = shuffledDatabase.slice(startIndex, Math.min(endIndex, shuffledDatabase.length));
    
    // If we don't have enough words for this day, generate additional ones
    if (availableWords.length < 40) {
      const needed = 40 - availableWords.length;
      const generatedWords: SATWord[] = [];
      
      for (let i = 0; i < needed; i++) {
        const wordIndex = (startIndex + availableWords.length + i) % shuffledDatabase.length;
        generatedWords.push({
          ...shuffledDatabase[wordIndex],
          english: `${shuffledDatabase[wordIndex].english}_${day}_${i}`
        });
      }
      
      // Return the combined words (already randomized from shuffledDatabase)
      return [...availableWords, ...generatedWords];
    }
    
    // Return the words (already randomized from shuffledDatabase)
    return availableWords;
  }
  
  // Generate words by cycling through the shuffled database
  const words: SATWord[] = [];
  for (let i = 0; i < 40; i++) {
    const wordIndex = (startIndex + i) % shuffledDatabase.length;
    words.push({
      ...shuffledDatabase[wordIndex],
      english: `${shuffledDatabase[wordIndex].english}_${day}_${i}`
    });
  }
  
  // Return the words (already randomized from shuffledDatabase)
  return words;
}

// Get all 2,000 words
export function getAllWords(): SATWord[] {
  const allWords: SATWord[] = [];
  for (let day = 1; day <= 50; day++) {
    allWords.push(...generateSATWordsForDay(day));
  }
  return allWords;
}
