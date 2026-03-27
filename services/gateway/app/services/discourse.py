"""
Professional discourse: practitioner-like tone for NurseAda responses.
Makes recommendations and diagnoses feel like talking to a real medical practitioner.
Supports locale-aware translations via the t() helper.
"""

# ── Locale-aware translation layer ──────────────────────────────────

TRANSLATIONS: dict[str, dict[str, str]] = {
    "en": {
        "triage_opening": "Based on what you've shared, here's my assessment.",
        "severity_line": "I'd rate the severity as **{severity}**.",
        "confidence_line": "My confidence in this assessment is about {pct}%.",
        "reasoning_line": "Here's my reasoning: {reasoning}",
        "recommendations_header": "Here's what I recommend:",
        "codes_footnote": "(I've used these clinical codes for transparency: {codes})",
        "herbal_header": "**Complementary options (herbal/natural):**",
        "emergency_ack": "I'm concerned about what you've described.",
        "urgent_ack": "Given what you've shared, I'd advise acting soon.",
        "routine_ack": "From what you've described, this sounds manageable with some care.",
        "herbal_opening": "Here are some evidence-based complementary options that may help:",
        "herbal_disclaimer": "\n\n---\n**Important:** These are complementary options and should not replace conventional medical treatment. Always tell your healthcare provider about any herbal remedies you use, especially if you take medications.",
        "appointment_opening": "Here are some healthcare facilities that may help:",
        "appointment_followup_high": "I'd recommend seeing a doctor today. Would you like help finding a clinic?",
        "appointment_followup_medium": "Consider scheduling a visit with your healthcare provider soon.",
        "appointment_followup_low": "If symptoms persist, you may want to book a routine appointment.",
        "appointment_disclaimer": "\n\n---\n**Note:** Appointment requests are for scheduling purposes only. They do not constitute a medical consultation. Please confirm availability directly with the facility.",
        "could_not_process": "I wasn't able to process that fully. Could you rephrase or add a bit more detail? For emergencies, please call 112 or go to the nearest hospital.",
        "could_not_match": "I'd like to help, but I need a bit more detail. Could you mention specific symptoms (e.g. fever, headache, cough) or medication names? That way I can give you a proper recommendation.",
        "something_went_wrong": "Something went wrong on our side. Please try again. For urgent health issues, seek care in person or call emergency services.",
        "avoid_if": "**Avoid if:** {items}",
        "telemedicine_available": "Telemedicine available",
        "next_steps": "**Next steps:** {text}",
    },
    "pcm": {
        "triage_opening": "Based on wetin you tell me, na this one be my assessment.",
        "severity_line": "I go rate how serious e be as **{severity}**.",
        "confidence_line": "I dey about {pct}% sure of this assessment.",
        "reasoning_line": "See why I think so: {reasoning}",
        "recommendations_header": "See wetin I recommend:",
        "codes_footnote": "(I use these clinical codes for transparency: {codes})",
        "herbal_header": "**Local remedies wey fit help:**",
        "emergency_ack": "Wetin you describe dey worry me.",
        "urgent_ack": "Based on wetin you share, I go advise say make you act fast.",
        "routine_ack": "From wetin you tell me, this one fit manage with small care.",
        "herbal_opening": "See some local remedies wey get evidence say dem fit help:",
        "herbal_disclaimer": "\n\n---\n**Important:** These ones na complementary option. Dem no suppose replace hospital treatment. Always tell your doctor about any local remedy wey you dey use.",
        "appointment_opening": "See some hospital and clinic wey fit help you:",
        "appointment_followup_high": "I go recommend say make you see doctor today. You want make I help you find clinic?",
        "appointment_followup_medium": "Try book appointment with your doctor soon.",
        "appointment_followup_low": "If the thing no stop, try book appointment.",
        "appointment_disclaimer": "\n\n---\n**Note:** Appointment request na for scheduling only. E no be doctor consultation. Confirm with the hospital directly.",
        "could_not_process": "I no fit process that one well well. Abeg try rephrase or add more detail. For emergency, call 112 or go hospital sharp sharp.",
        "could_not_match": "I wan help you, but I need more detail. Abeg mention specific symptoms (like fever, headache, cough) or medicine name.",
        "something_went_wrong": "Something go wrong for our side. Abeg try again. For serious health matter, go hospital or call emergency.",
        "avoid_if": "**No use am if:** {items}",
        "telemedicine_available": "Phone/Video dey available",
        "next_steps": "**Wetin to do next:** {text}",
    },
    "ha": {
        "triage_opening": "Dangane da abin da kuka faɗa, ga abin da na gani.",
        "severity_line": "Zan kiyasta tsananin cutar a matsayin **{severity}**.",
        "confidence_line": "Amincewata da wannan bincike kusan {pct}% ne.",
        "reasoning_line": "Ga dalilin da na yi tunani haka: {reasoning}",
        "recommendations_header": "Ga abin da zan ba da shawara:",
        "codes_footnote": "(Na yi amfani da waɗannan lambobin asibiti don nuna gaskiya: {codes})",
        "herbal_header": "**Maganin gargajiya wanda zai iya taimaka:**",
        "emergency_ack": "Abin da kuka bayyana yana damuna.",
        "urgent_ack": "Dangane da abin da kuka raba, ina ba da shawara ku yi sauri.",
        "routine_ack": "Dangane da abin da kuka bayyana, wannan na iya sarrafa shi da ɗan kulawa.",
        "herbal_opening": "Ga wasu magungunan gargajiya waɗanda ke da shaidar kimiyya da za su iya taimaka:",
        "herbal_disclaimer": "\n\n---\n**Mahimmanci:** Waɗannan zaɓuɓɓuka ne na ƙarawa, ba don maye gurbin maganin asibiti ba. Kullum ka gaya wa likitanka game da maganin gargajiya da kake amfani da shi.",
        "appointment_opening": "Ga wasu asibitoci da za su iya taimaka muku:",
        "appointment_followup_high": "Ina ba da shawara ku ga likita yau. Kuna so in taimake ku nemo asibiti?",
        "appointment_followup_medium": "Ku dubi yin alƙawari da likitanku nan ba da jimawa ba.",
        "appointment_followup_low": "Idan alamun ba su daina ba, za ku iya yin alƙawari.",
        "appointment_disclaimer": "\n\n---\n**Lura:** Neman alƙawari don tsarin lokaci ne kawai. Ba ziyarar likita ba ne. Ka tabbatar tare da asibitin kai tsaye.",
        "could_not_process": "Ban iya magance wannan gaba ɗaya ba. Za ka iya sake bayyanawa ko ƙara bayani? Idan gaggawa ce, kira 112 ko je asibiti.",
        "could_not_match": "Ina so in taimaka, amma ina buƙatar ƙarin bayani. Za ka iya ambata takamaiman alamomi (kamar zazzaɓi, ciwon kai) ko sunayen magunguna?",
        "something_went_wrong": "Wani abu ya faru a gefen mu. Ka sake gwadawa. Don matsalolin lafiya masu tsanani, nemi kulawa kai tsaye.",
        "avoid_if": "**Kada ka yi amfani idan:** {items}",
        "telemedicine_available": "Ana iya ta waya/bidiyo",
        "next_steps": "**Mataki na gaba:** {text}",
    },
    "yo": {
        "triage_opening": "Gẹ́gẹ́ bí ohun tí o sọ fún mi, èyí ni àyẹ̀wò mi.",
        "severity_line": "Mo lè sọ pé ìgara àrùn náà jẹ́ **{severity}**.",
        "confidence_line": "Ìgbàgbọ́ mi nínú àyẹ̀wò yìí jẹ́ nǹkan bíi {pct}%.",
        "reasoning_line": "Ìdí tí mo fi rò bẹ́ẹ̀: {reasoning}",
        "recommendations_header": "Ohun tí mo dábàá:",
        "codes_footnote": "(Mo lo àwọn kóòdù ìṣègùn wọ̀nyí fún ìhànsí: {codes})",
        "herbal_header": "**Àwọn àgbo tí ó lè ran ọ́ lọ́wọ́:**",
        "emergency_ack": "Ohun tí o ṣàpèjúwe ń ṣe mi lókàn.",
        "urgent_ack": "Bí mo ṣe wo ohun tí o sọ, mo gbà ní ìmọ̀ràn kí o ṣiṣẹ́ kíákíá.",
        "routine_ack": "Gẹ́gẹ́ bí ohun tí o sọ, èyí dà bíi pé ó lè ṣàkóso pẹ̀lú ìtọ́jú kékeré.",
        "herbal_opening": "Àwọn àṣàyàn àgbo tí ó ní ẹ̀rí tí ó lè ṣe ìrànlọ́wọ́:",
        "herbal_disclaimer": "\n\n---\n**Pàtàkì:** Àwọn wọ̀nyí jẹ́ àṣàyàn àfikún, kì í ṣe arọ́pò ìtọ́jú ilé ìwòsàn. Máa sọ fún dókítà rẹ nípa àgbo tí o ń lò.",
        "appointment_opening": "Àwọn ilé ìwòsàn tí ó lè ṣe ìrànlọ́wọ́:",
        "appointment_followup_high": "Mo gbà ní ìmọ̀ràn kí o rí dókítà lónìí. Ṣé o fẹ́ kí n ṣe ìrànlọ́wọ́ láti wá ilé ìwòsàn?",
        "appointment_followup_medium": "Rò nípa ṣíṣe ìpàdé pẹ̀lú dókítà rẹ láìpẹ́.",
        "appointment_followup_low": "Tí àmì àrùn bá tẹ̀síwájú, o lè ṣe ìpàdé.",
        "appointment_disclaimer": "\n\n---\n**Àkíyèsí:** Ìbéèrè ìpàdé jẹ́ fún ṣíṣe àkójọ nìkan. Kì í ṣe ìjíròrò dókítà. Ṣe ìdánilójú tààrà pẹ̀lú ilé ìwòsàn.",
        "could_not_process": "Mi ò lè ṣe àlàyé rẹ̀ pátápátá. Ṣé o lè sọ ní ọ̀nà mìíràn? Fún pàjáwìrì, pe 112 tàbí lọ sí ilé ìwòsàn.",
        "could_not_match": "Mo fẹ́ ṣe ìrànlọ́wọ́, àmọ́ mo nílò àlàyé sí i. Ṣé o lè mẹ́nuba àmì àrùn kan pàtó (bíi ibà, orí fífọ́)?",
        "something_went_wrong": "Nǹkan kan ṣẹlẹ̀ ní ẹ̀gbẹ́ wa. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kan sí i. Fún ọ̀ràn ìlera pàtàkì, wá ìtọ́jú.",
        "avoid_if": "**Má ṣe lò bí:** {items}",
        "telemedicine_available": "Foonu/Fídíò wà",
        "next_steps": "**Ìgbésẹ̀ tó kàn:** {text}",
    },
    "ig": {
        "triage_opening": "Dabere na ihe ị gwara m, nke a bụ nyocha m.",
        "severity_line": "M ga-akwado oke ịda njọ dịka **{severity}**.",
        "confidence_line": "Ntụkwasị obi m na nyocha a bụ ihe dịka {pct}%.",
        "reasoning_line": "Nke a bụ ihe kpatara m ji eche otu a: {reasoning}",
        "recommendations_header": "Ihe m na-atụ aro:",
        "codes_footnote": "(Ejiri m koodu ndị a maka ikwupụta: {codes})",
        "herbal_header": "**Ọgwụ ọdịnala nke nwere ike inyere gị aka:**",
        "emergency_ack": "Ihe ị kọwara na-enye m nchegbu.",
        "urgent_ack": "Dabere na ihe ị kekọrịtara, a na m atụ aro ka ị me ngwa ngwa.",
        "routine_ack": "Dabere na ihe ị kọwara, nke a nwere ike ijikwa ya na nlekọta ntakịrị.",
        "herbal_opening": "Lee ụfọdụ ọgwụ ọdịnala nwere ihe akaebe nke nwere ike inyere aka:",
        "herbal_disclaimer": "\n\n---\n**Ọ dị mkpa:** Ndị a bụ nhọrọ nkwado, ha abụghị ọnọdụ ọgwụgwọ ụlọ ọgwụ. Gwara dọkịta gị maka ọgwụ ọdịnala ọ bụla ị na-eji.",
        "appointment_opening": "Lee ụfọdụ ụlọ ọgwụ nwere ike inyere gị aka:",
        "appointment_followup_high": "Ana m atụ aro ka ị hụ dọkịta taa. Ị chọrọ ka m nyere gị aka ịchọta ụlọ ọgwụ?",
        "appointment_followup_medium": "Tụlee ịhazi nkwekọrịta na dọkịta gị n'oge na-adịghị anya.",
        "appointment_followup_low": "Ọ bụrụ na mgbaàmà adịgide, ị nwere ike ịhazi nkwekọrịta.",
        "appointment_disclaimer": "\n\n---\n**Ndetu:** Arịrịọ nkwekọrịta bụ maka nhazi oge naanị. Ọ bụghị ịhụ dọkịta. Kwado na ụlọ ọgwụ kpọmkwem.",
        "could_not_process": "Enweghị m ike idozi nke ahụ nke ọma. Ị nwere ike ịgwa m n'ụzọ ọzọ? Maka mberede, kpọọ 112 ma ọ bụ gaa ụlọ ọgwụ.",
        "could_not_match": "Achọrọ m inyere gị aka, mana achọrọ m ozi ndị ọzọ. Biko kwuo mgbaàmà pụrụ iche (dịka ọkụ ahụ, isi ọwụwa)?",
        "something_went_wrong": "Ihe mere n'akụkụ anyị. Biko nwaa ọzọ. Maka nsogbu ahụ ike dị oke, chọọ nlekọta.",
        "avoid_if": "**Ejila ya ma ọ bụrụ na:** {items}",
        "telemedicine_available": "Ekwentị/Vidio dị",
        "next_steps": "**Nzọụkwụ ọzọ:** {text}",
    },
}


def t(key: str, locale: str | None = None, **kwargs: str) -> str:
    """Get a translated discourse string, falling back to English."""
    loc = locale or "en"
    text = TRANSLATIONS.get(loc, TRANSLATIONS["en"]).get(key)
    if text is None:
        text = TRANSLATIONS["en"].get(key, key)
    if kwargs:
        text = text.format(**kwargs)
    return text


# Legacy constants (still used by orchestrator imports) — delegate to English
TRIAGE_OPENING = TRANSLATIONS["en"]["triage_opening"]
SEVERITY_LINE = TRANSLATIONS["en"]["severity_line"]
CONFIDENCE_LINE = TRANSLATIONS["en"]["confidence_line"]
REASONING_LINE = TRANSLATIONS["en"]["reasoning_line"]
RECOMMENDATIONS_HEADER = TRANSLATIONS["en"]["recommendations_header"]
CODES_FOOTNOTE = TRANSLATIONS["en"]["codes_footnote"]
HERBAL_HEADER = TRANSLATIONS["en"]["herbal_header"]

EMERGENCY_ACK = TRANSLATIONS["en"]["emergency_ack"]
URGENT_ACK = TRANSLATIONS["en"]["urgent_ack"]
ROUTINE_ACK = TRANSLATIONS["en"]["routine_ack"]

# ── Herbal response formatting ─────────────────────────────────────────

HERBAL_OPENING = TRANSLATIONS["en"]["herbal_opening"]

HERBAL_EVIDENCE_PREFIX = {
    "strong": "**Evidence:** Supported by clinical research",
    "moderate": "**Evidence:** Some research supports this use",
    "limited": "**Evidence:** Limited research; based mainly on traditional practice",
    "traditional": "**Evidence:** Based on traditional practice; not yet validated clinically",
}

HERBAL_CONTRAINDICATION_PREFIX = TRANSLATIONS["en"]["avoid_if"]

HERBAL_INTERACTION_WARNING = {
    "critical": "**CRITICAL interaction with {drug}:** {message}",
    "major": "**Major interaction with {drug}:** {message}",
    "moderate": "**Caution with {drug}:** {message}",
    "minor": "Note ({drug}): {message}",
}

HERBAL_DISCLAIMER = TRANSLATIONS["en"]["herbal_disclaimer"]

# ── Appointment response formatting ──────────────────────────────────

APPOINTMENT_OPENING = TRANSLATIONS["en"]["appointment_opening"]

APPOINTMENT_FOLLOWUP = {
    "high": TRANSLATIONS["en"]["appointment_followup_high"],
    "medium": TRANSLATIONS["en"]["appointment_followup_medium"],
    "low": TRANSLATIONS["en"]["appointment_followup_low"],
}

APPOINTMENT_DISCLAIMER = TRANSLATIONS["en"]["appointment_disclaimer"]


def format_clinic_list(clinics: list[dict], locale: str | None = None) -> str:
    """Render clinic cards with name, address, phone, specialties, and telemedicine flag."""
    if not clinics:
        return ""
    tele_label = t("telemedicine_available", locale)
    lines: list[str] = []
    for c in clinics:
        name = c.get("name", "Unknown Facility")
        lines.append(f"**{name}**")
        lines.append(f"  Address: {c.get('address', '')} — {c.get('city', '')}, {c.get('state', '')}")
        lines.append(f"  Phone: {c.get('phone', 'N/A')}")
        specs = c.get("specialties", [])
        if specs:
            lines.append(f"  Specialties: {', '.join(specs)}")
        lines.append(f"  Hours: {c.get('hours', 'N/A')}")
        if c.get("accepts_telemedicine"):
            lines.append(f"  {tele_label}")
        lines.append("")
    return "\n".join(lines).rstrip()


def format_appointment_followup(severity: str, locale: str | None = None) -> str:
    """Return severity-appropriate appointment follow-up text."""
    key = f"appointment_followup_{severity.lower()}"
    text = t(key, locale) if key in TRANSLATIONS.get(locale or "en", TRANSLATIONS["en"]) else t("appointment_followup_low", locale)
    return "\n\n" + t("next_steps", locale, text=text)


# Error/fallback – still professional
COULD_NOT_PROCESS = TRANSLATIONS["en"]["could_not_process"]
COULD_NOT_MATCH = TRANSLATIONS["en"]["could_not_match"]
SOMETHING_WENT_WRONG = TRANSLATIONS["en"]["something_went_wrong"]


def format_herbal_chunk(chunk: dict, locale: str | None = None) -> str:
    """Format a single herbal remedy with evidence, contraindications, and interactions."""
    lines: list[str] = []
    lines.append(f"• {chunk.get('text', '')}")

    ev = chunk.get("evidence_level", "")
    if ev and ev in HERBAL_EVIDENCE_PREFIX:
        lines.append(f"  {HERBAL_EVIDENCE_PREFIX[ev]}")

    contras = chunk.get("contraindications", [])
    if contras:
        lines.append(f"  {t('avoid_if', locale, items=', '.join(contras))}")

    interactions = chunk.get("drug_interactions", [])
    for ix in interactions:
        sev = ix.get("severity", "moderate")
        tmpl = HERBAL_INTERACTION_WARNING.get(sev, HERBAL_INTERACTION_WARNING["moderate"])
        lines.append(f"  {tmpl.format(drug=ix.get('drug', ''), message=ix.get('message', ''))}")

    return "\n".join(lines)


def format_herbal_response(chunks: list[dict], locale: str | None = None) -> str:
    """Build a full herbal recommendation response from retrieved chunks."""
    if not chunks:
        return ""
    sections = [t("herbal_opening", locale), ""]
    for chunk in chunks:
        sections.append(format_herbal_chunk(chunk, locale))
        sections.append("")
    return "\n".join(sections).rstrip()


def format_triage_response(
    severity: str,
    confidence: float | None,
    reasoning: str,
    suggestions: list[str],
    inferred_codes: list[dict],
    observations_note: str = "",
    locale: str | None = None,
) -> str:
    """Build a practitioner-like triage response."""
    lines = [t("triage_opening", locale), ""]
    if severity == "emergency":
        lines.append(t("emergency_ack", locale))
    elif severity == "high":
        lines.append(t("urgent_ack", locale))
    elif severity == "medium":
        lines.append(t("urgent_ack", locale))
    elif severity == "low":
        lines.append(t("routine_ack", locale))
    lines.append("")
    lines.append(t("severity_line", locale, severity=severity))
    if confidence is not None:
        lines.append(t("confidence_line", locale, pct=str(int(confidence * 100))))
    if reasoning:
        lines.append(t("reasoning_line", locale, reasoning=reasoning))
    if suggestions:
        lines.append("")
        lines.append(t("recommendations_header", locale))
        for s in suggestions:
            lines.append(f"• {s}")
    if inferred_codes:
        codes_str = ", ".join(c.get("display", c.get("code", "")) for c in inferred_codes[:5])
        lines.append("")
        lines.append(t("codes_footnote", locale, codes=codes_str))
    if observations_note.strip():
        lines.append(observations_note.strip())
    return "\n".join(lines)
