/* Depta languages: built-in (offline) Kinyarwanda, Kiswahili, Français, العربية, Español, Português + auto-translate for every other language. */
(function () {
  const COLS = ['rw', 'sw', 'fr', 'ar', 'es', 'pt'];
  const BUILTIN = [['en', 'English'], ['rw', 'Kinyarwanda'], ['sw', 'Kiswahili'], ['fr', 'Français'], ['ar', 'العربية'], ['es', 'Español'], ['pt', 'Português']];
  const LOCALE = { en: undefined, rw: 'rw', sw: 'sw', fr: 'fr', ar: 'ar', es: 'es', pt: 'pt' };
  const MORE = [['am', 'አማርኛ · Amharic'], ['af', 'Afrikaans'], ['sq', 'Shqip · Albanian'], ['hy', 'Հայերեն · Armenian'], ['az', 'Azərbaycan'], ['eu', 'Euskara · Basque'], ['be', 'Беларуская'], ['bn', 'বাংলা · Bengali'], ['bs', 'Bosanski'], ['bg', 'Български'], ['my', 'မြန်မာ · Burmese'], ['ca', 'Català'], ['ceb', 'Cebuano'], ['ny', 'Chichewa'], ['zh-CN', '中文 · Chinese (Simplified)'], ['zh-TW', '中文 · Chinese (Traditional)'], ['co', 'Corsu'], ['hr', 'Hrvatski'], ['cs', 'Čeština'], ['da', 'Dansk'], ['nl', 'Nederlands'], ['eo', 'Esperanto'], ['et', 'Eesti'], ['tl', 'Filipino'], ['fi', 'Suomi'], ['fy', 'Frysk'], ['gl', 'Galego'], ['ka', 'ქართული · Georgian'], ['de', 'Deutsch'], ['el', 'Ελληνικά · Greek'], ['gu', 'ગુજરાતી · Gujarati'], ['ht', 'Kreyòl ayisyen'], ['ha', 'Hausa'], ['haw', 'ʻŌlelo Hawaiʻi'], ['iw', 'עברית · Hebrew'], ['hi', 'हिन्दी · Hindi'], ['hmn', 'Hmong'], ['hu', 'Magyar'], ['is', 'Íslenska'], ['ig', 'Igbo'], ['id', 'Bahasa Indonesia'], ['ga', 'Gaeilge'], ['it', 'Italiano'], ['ja', '日本語 · Japanese'], ['jw', 'Basa Jawa'], ['kn', 'ಕನ್ನಡ · Kannada'], ['kk', 'Қазақша'], ['km', 'ខ្មែរ · Khmer'], ['ko', '한국어 · Korean'], ['ku', 'Kurdî'], ['ky', 'Кыргызча'], ['lo', 'ລາວ · Lao'], ['la', 'Latina'], ['lv', 'Latviešu'], ['lt', 'Lietuvių'], ['lb', 'Lëtzebuergesch'], ['mk', 'Македонски'], ['mg', 'Malagasy'], ['ms', 'Bahasa Melayu'], ['ml', 'മലയാളം · Malayalam'], ['mt', 'Malti'], ['mi', 'Māori'], ['mr', 'मराठी · Marathi'], ['mn', 'Монгол'], ['ne', 'नेपाली · Nepali'], ['no', 'Norsk'], ['ps', 'پښتو · Pashto'], ['fa', 'فارسی · Persian'], ['pl', 'Polski'], ['pa', 'ਪੰਜਾਬੀ · Punjabi'], ['ro', 'Română'], ['ru', 'Русский'], ['sm', 'Samoan'], ['gd', 'Gàidhlig'], ['sr', 'Српски'], ['st', 'Sesotho'], ['sn', 'chiShona'], ['sd', 'سنڌي · Sindhi'], ['si', 'සිංහල · Sinhala'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'], ['so', 'Soomaali'], ['su', 'Basa Sunda'], ['sv', 'Svenska'], ['tg', 'Тоҷикӣ'], ['ta', 'தமிழ் · Tamil'], ['te', 'తెలుగు · Telugu'], ['th', 'ไทย · Thai'], ['tr', 'Türkçe'], ['uk', 'Українська'], ['ur', 'اردو · Urdu'], ['uz', 'Oʻzbek'], ['vi', 'Tiếng Việt'], ['cy', 'Cymraeg · Welsh'], ['xh', 'isiXhosa'], ['yi', 'ייִדיש · Yiddish'], ['yo', 'Yorùbá'], ['zu', 'isiZulu']];

  /* English | Kinyarwanda | Kiswahili | Français | العربية | Español | Português
     {n} = a number, {x}/{y} = any text (only for whole-line matches) */
  const ROWS = [
    // ---- navigation & general
    ["Today", "Uyu munsi", "Leo", "Aujourd'hui", "اليوم", "Hoy", "Hoje"],
    ["today", "uyu munsi", "leo", "aujourd'hui", "اليوم", "hoy", "hoje"],
    ["Debts", "Imyenda", "Madeni", "Dettes", "الديون", "Deudas", "Dívidas"],
    ["Customers", "Abakiriya", "Wateja", "Clients", "العملاء", "Clientes", "Clientes"],
    ["Customer", "Umukiriya", "Mteja", "Client", "العميل", "Cliente", "Cliente"],
    ["Reports", "Raporo", "Ripoti", "Rapports", "التقارير", "Informes", "Relatórios"],
    ["Settings", "Igenamiterere", "Mipangilio", "Paramètres", "الإعدادات", "Ajustes", "Configurações"],
    ["Password", "Ijambo ry'ibanga", "Nenosiri", "Mot de passe", "كلمة المرور", "Contraseña", "Senha"],
    ["Sign out", "Sohoka", "Toka", "Se déconnecter", "تسجيل الخروج", "Cerrar sesión", "Sair"],
    ["Sign in", "Injira", "Ingia", "Se connecter", "تسجيل الدخول", "Iniciar sesión", "Entrar"],
    ["Install app", "Shyiraho porogaramu", "Sakinisha programu", "Installer l'app", "تثبيت التطبيق", "Instalar app", "Instalar app"],
    ["Install app on this phone", "Shyira porogaramu kuri iyi telefoni", "Sakinisha programu kwenye simu hii", "Installer l'app sur ce téléphone", "ثبّت التطبيق على هذا الهاتف", "Instalar la app en este teléfono", "Instalar o app neste telefone"],
    ["Text size", "Ingano y'inyuguti", "Ukubwa wa maandishi", "Taille du texte", "حجم النص", "Tamaño del texto", "Tamanho do texto"],
    ["Change text size", "Hindura ingano y'inyuguti", "Badilisha ukubwa wa maandishi", "Changer la taille du texte", "تغيير حجم النص", "Cambiar tamaño del texto", "Mudar tamanho do texto"],
    ["Switch light / dark", "Hindura urumuri / umwijima", "Badilisha mwanga / giza", "Clair / sombre", "فاتح / داكن", "Claro / oscuro", "Claro / escuro"],
    ["Switch light or dark mode", "Hindura urumuri cyangwa umwijima", "Badilisha hali ya mwanga au giza", "Basculer clair ou sombre", "تبديل الوضع الفاتح أو الداكن", "Cambiar modo claro u oscuro", "Alternar modo claro ou escuro"],
    ["Language", "Ururimi", "Lugha", "Langue", "اللغة", "Idioma", "Idioma"],
    ["Live", "Ako kanya", "Moja kwa moja", "En direct", "مباشر", "En vivo", "Ao vivo"],
    ["Close", "Funga", "Funga", "Fermer", "إغلاق", "Cerrar", "Fechar"],
    ["‹ Back", "‹ Subira inyuma", "‹ Rudi", "‹ Retour", "‹ رجوع", "‹ Atrás", "‹ Voltar"],
    ["Add", "Ongeraho", "Ongeza", "Ajouter", "إضافة", "Añadir", "Adicionar"],
    ["Done", "Byarangiye", "Imekamilika", "Terminé", "تم", "Listo", "Concluído"],
    ["Save", "Bika", "Hifadhi", "Enregistrer", "حفظ", "Guardar", "Salvar"],
    ["Saved", "Byabitswe", "Imehifadhiwa", "Enregistré", "تم الحفظ", "Guardado", "Salvo"],
    ["Save changes", "Bika impinduka", "Hifadhi mabadiliko", "Enregistrer les modifications", "حفظ التغييرات", "Guardar cambios", "Salvar alterações"],
    ["Edit", "Hindura", "Hariri", "Modifier", "تعديل", "Editar", "Editar"],
    ["Undo", "Subiza inyuma", "Tendua", "Annuler", "تراجع", "Deshacer", "Desfazer"],
    ["Share", "Sangiza", "Shiriki", "Partager", "مشاركة", "Compartir", "Compartilhar"],
    ["Print", "Priinta", "Chapisha", "Imprimer", "طباعة", "Imprimir", "Imprimir"],
    ["Copied", "Byakoporowe", "Imenakiliwa", "Copié", "تم النسخ", "Copiado", "Copiado"],
    ["Select and copy", "Hitamo hanyuma ukoporore", "Chagua kisha nakili", "Sélectionnez et copiez", "حدّد ثم انسخ", "Seleccione y copie", "Selecione e copie"],
    ["Try again", "Ongera ugerageze", "Jaribu tena", "Réessayer", "حاول مرة أخرى", "Intentar de nuevo", "Tentar novamente"],
    ["All", "Byose", "Zote", "Tout", "الكل", "Todo", "Todos"],
    ["Open", "Bifunguye", "Wazi", "Ouvert", "مفتوح", "Abierto", "Aberto"],
    ["More", "Ibindi", "Zaidi", "Plus", "المزيد", "Más", "Mais"],
    ["More details", "Ibindi bisobanuro", "Maelezo zaidi", "Plus de détails", "مزيد من التفاصيل", "Más detalles", "Mais detalhes"],
    ["Details", "Ibisobanuro", "Maelezo", "Détails", "التفاصيل", "Detalles", "Detalhes"],
    ["History", "Amateka", "Historia", "Historique", "السجل", "Historial", "Histórico"],
    ["Nothing yet.", "Nta kintu kiraboneka.", "Bado hakuna kitu.", "Rien pour l'instant.", "لا شيء بعد.", "Nada todavía.", "Nada ainda."],
    ["No data.", "Nta makuru.", "Hakuna data.", "Aucune donnée.", "لا توجد بيانات.", "Sin datos.", "Sem dados."],
    ["optional", "ntibiteganijwe", "si lazima", "facultatif", "اختياري", "opcional", "opcional"],
    ["— choose —", "— hitamo —", "— chagua —", "— choisir —", "— اختر —", "— elegir —", "— escolher —"],
    ["Amount", "Amafaranga", "Kiasi", "Montant", "المبلغ", "Monto", "Valor"],
    ["Balance", "Asigaye", "Salio", "Solde", "الرصيد", "Saldo", "Saldo"],
    ["Total", "Yose hamwe", "Jumla", "Total", "الإجمالي", "Total", "Total"],
    ["Date", "Itariki", "Tarehe", "Date", "التاريخ", "Fecha", "Data"],
    ["Name", "Izina", "Jina", "Nom", "الاسم", "Nombre", "Nome"],
    ["Phone", "Telefoni", "Simu", "Téléphone", "الهاتف", "Teléfono", "Telefone"],
    ["Email", "Imeri", "Barua pepe", "E-mail", "البريد الإلكتروني", "Correo electrónico", "E-mail"],
    ["Note", "Icyitonderwa", "Maelezo", "Note", "ملاحظة", "Nota", "Nota"],
    ["Reason", "Impamvu", "Sababu", "Raison", "السبب", "Motivo", "Motivo"],
    ["Reference", "Nomero y'indango", "Rejea", "Référence", "المرجع", "Referencia", "Referência"],
    ["Branch", "Ishami", "Tawi", "Succursale", "الفرع", "Sucursal", "Filial"],
    ["Item", "Igicuruzwa", "Bidhaa", "Article", "البند", "Artículo", "Item"],
    ["Month", "Ukwezi", "Mwezi", "Mois", "الشهر", "Mes", "Mês"],
    ["Week", "Icyumweru", "Wiki", "Semaine", "أسبوع", "Semana", "Semana"],
    ["From", "Kuva", "Kutoka", "Du", "من", "Desde", "De"],
    ["To", "Kugeza", "Hadi", "Au", "إلى", "Hasta", "Até"],
    ["Period", "Igihe", "Kipindi", "Période", "الفترة", "Período", "Período"],
    ["Right now", "Ubu", "Sasa hivi", "En ce moment", "الآن", "Ahora mismo", "Agora"],
    ["Offline – Depta", "Nta murandasi – Depta", "Nje ya mtandao – Depta", "Hors ligne – Depta", "غير متصل – Depta", "Sin conexión – Depta", "Offline – Depta"],
    ["You're offline", "Nta murandasi ufite", "Huna mtandao", "Vous êtes hors ligne", "أنت غير متصل", "Estás sin conexión", "Você está offline"],
    ["Depta needs an internet connection to keep your debt records safe and in sync. Check your data or Wi-Fi, then try again.", "Depta ikeneye murandasi kugira ngo ibitabo by'imyenda yawe bibikwe neza. Reba amakuru (data) cyangwa Wi-Fi, hanyuma ongera ugerageze.", "Depta inahitaji mtandao ili kuweka kumbukumbu za madeni yako salama. Angalia data au Wi-Fi, kisha jaribu tena.", "Depta a besoin d'une connexion Internet pour garder vos dettes en sécurité. Vérifiez vos données ou le Wi-Fi, puis réessayez.", "يحتاج Depta إلى اتصال بالإنترنت للحفاظ على سجلات ديونك. تحقق من البيانات أو الواي فاي ثم حاول مجددًا.", "Depta necesita conexión a Internet para mantener tus deudas seguras. Revisa tus datos o el Wi-Fi e inténtalo de nuevo.", "O Depta precisa de internet para manter suas dívidas seguras. Verifique seus dados ou o Wi-Fi e tente novamente."],
    // ---- login / register
    ["Sign in – Depta", "Injira – Depta", "Ingia – Depta", "Connexion – Depta", "تسجيل الدخول – Depta", "Iniciar sesión – Depta", "Entrar – Depta"],
    ["Register – Depta", "Iyandikishe – Depta", "Jisajili – Depta", "Inscription – Depta", "التسجيل – Depta", "Registro – Depta", "Cadastro – Depta"],
    ["Depta – Debt collector", "Depta – Kwishyuza imyenda", "Depta – Mkusanya madeni", "Depta – Recouvrement de dettes", "Depta – محصّل الديون", "Depta – Cobro de deudas", "Depta – Cobrança de dívidas"],
    ["Record, chase and collect every debt owed to your shop.", "Andika, wibutse kandi wishyuze imyenda yose yishyuzwa iduka ryawe.", "Rekodi, fuatilia na kusanya kila deni analodaiwa duka lako.", "Enregistrez, relancez et recouvrez chaque dette due à votre boutique.", "سجّل وتابع وحصّل كل دين مستحق لمتجرك.", "Registra, reclama y cobra cada deuda de tu tienda.", "Registre, cobre e receba cada dívida da sua loja."],
    ["New here?", "Uri mushya?", "Mgeni hapa?", "Nouveau ici ?", "جديد هنا؟", "¿Nuevo aquí?", "Novo por aqui?"],
    ["Create an account", "Fungura konti", "Fungua akaunti", "Créer un compte", "أنشئ حسابًا", "Crear una cuenta", "Criar uma conta"],
    ["Create account", "Fungura konti", "Fungua akaunti", "Créer le compte", "إنشاء حساب", "Crear cuenta", "Criar conta"],
    ["Create your Depta account", "Fungura konti yawe ya Depta", "Fungua akaunti yako ya Depta", "Créez votre compte Depta", "أنشئ حسابك في Depta", "Crea tu cuenta de Depta", "Crie sua conta Depta"],
    ["Already registered?", "Waramaze kwiyandikisha?", "Umeshajisajili?", "Déjà inscrit ?", "مسجّل بالفعل؟", "¿Ya tienes cuenta?", "Já tem cadastro?"],
    ["Free debt book for your shop. You can link CTone later in Settings.", "Igitabo cy'imyenda cy'iduka ryawe. Ushobora guhuza na CTone nyuma mu Igenamiterere.", "Daftari la madeni la duka lako. Unaweza kuunganisha CTone baadaye kwenye Mipangilio.", "Un carnet de dettes pour votre boutique. Vous pourrez lier CTone plus tard dans les Paramètres.", "دفتر ديون لمتجرك. يمكنك ربط CTone لاحقًا من الإعدادات.", "Un libro de deudas para tu tienda. Puedes vincular CTone más tarde en Ajustes.", "Um caderno de dívidas para sua loja. Você pode vincular o CTone depois em Configurações."],
    ["Shop name", "Izina ry'iduka", "Jina la duka", "Nom de la boutique", "اسم المتجر", "Nombre de la tienda", "Nome da loja"],
    ["Your name", "Izina ryawe", "Jina lako", "Votre nom", "اسمك", "Tu nombre", "Seu nome"],
    ["Currency (e.g. UGX, KES, TZS)", "Ifaranga (urugero RWF, UGX, KES)", "Sarafu (mfano TZS, KES, UGX)", "Devise (ex. RWF, XOF, EUR)", "العملة (مثل RWF, KES, USD)", "Moneda (p. ej. USD, EUR, MXN)", "Moeda (ex. MZN, BRL, EUR)"],
    ["Password (6+ characters)", "Ijambo ry'ibanga (nibura inyuguti 6)", "Nenosiri (herufi 6 au zaidi)", "Mot de passe (6 caractères min.)", "كلمة المرور (6 أحرف أو أكثر)", "Contraseña (mín. 6 caracteres)", "Senha (mín. 6 caracteres)"],
    ["I already have a CTone account", "Nsanzwe mfite konti ya CTone", "Tayari nina akaunti ya CTone", "J'ai déjà un compte CTone", "لدي حساب CTone بالفعل", "Ya tengo una cuenta CTone", "Já tenho uma conta CTone"],
    ["Sign in above with your CTone email and password – Depta creates your account and links it to CTone.", "Injira haruguru ukoresheje imeri n'ijambo ry'ibanga bya CTone – Depta iguhanga konti kandi ikayihuza na CTone.", "Ingia hapo juu kwa barua pepe na nenosiri la CTone – Depta itakutengenezea akaunti na kuiunganisha na CTone.", "Connectez-vous ci-dessus avec votre e-mail et mot de passe CTone – Depta crée votre compte et le lie à CTone.", "سجّل الدخول أعلاه ببريد CTone وكلمة مروره – ينشئ Depta حسابك ويربطه بـ CTone.", "Inicia sesión arriba con tu correo y contraseña de CTone – Depta crea tu cuenta y la vincula a CTone.", "Entre acima com seu e-mail e senha do CTone – o Depta cria sua conta e a vincula ao CTone."],
    ["CTone address", "Aderesi ya CTone", "Anwani ya CTone", "Adresse de CTone", "عنوان CTone", "Dirección de CTone", "Endereço do CTone"],
    ["CTone email", "Imeri ya CTone", "Barua pepe ya CTone", "E-mail CTone", "بريد CTone", "Correo de CTone", "E-mail do CTone"],
    ["CTone password", "Ijambo ry'ibanga rya CTone", "Nenosiri la CTone", "Mot de passe CTone", "كلمة مرور CTone", "Contraseña de CTone", "Senha do CTone"],
    // ---- Today
    ["Total owed to you", "Amafaranga yose mugomba kwishyurwa", "Jumla unayodai", "Total qu'on vous doit", "إجمالي ما يُدين لك", "Total que te deben", "Total que lhe devem"],
    ["{n} customers owe you", "Abakiriya {n} barakwishyuzwa", "Wateja {n} wanakudai", "{n} clients vous doivent", "{n} عملاء مدينون لك", "{n} clientes te deben", "{n} clientes lhe devem"],
    ["{n} customer owe you", "Umukiriya {n} akwishyuzwa", "Mteja {n} anakudai", "{n} client vous doit", "{n} عميل مدين لك", "{n} cliente te debe", "{n} cliente lhe deve"],
    ["{n}% recovered so far", "{n}% byamaze kwishyurwa", "{n}% imeshakusanywa", "{n} % récupéré", "تم تحصيل {n}%", "{n}% recuperado", "{n}% recuperado"],
    ["Share today's summary", "Sangiza incamake y'uyu munsi", "Shiriki muhtasari wa leo", "Partager le résumé du jour", "مشاركة ملخص اليوم", "Compartir el resumen de hoy", "Compartilhar o resumo de hoje"],
    ["Overdue", "Byarengeje igihe", "Imechelewa", "En retard", "متأخر", "Vencido", "Atrasado"],
    ["Collected today", "Byishyuwe uyu munsi", "Imekusanywa leo", "Encaissé aujourd'hui", "المحصّل اليوم", "Cobrado hoy", "Recebido hoje"],
    ["Due today", "Bigomba kwishyurwa uyu munsi", "Inadaiwa leo", "À payer aujourd'hui", "مستحق اليوم", "Vence hoy", "Vence hoje"],
    ["Collected this month", "Byishyuwe muri uku kwezi", "Imekusanywa mwezi huu", "Encaissé ce mois-ci", "المحصّل هذا الشهر", "Cobrado este mes", "Recebido este mês"],
    ["Expected next 7 days", "Biteganyijwe mu minsi 7 iri imbere", "Inatarajiwa siku 7 zijazo", "Attendu dans les 7 jours", "المتوقع خلال 7 أيام", "Esperado en 7 días", "Esperado nos próximos 7 dias"],
    ["Lent this month", "Byatijwe muri uku kwezi", "Iliyokopeshwa mwezi huu", "Prêté ce mois-ci", "المُقرَض هذا الشهر", "Prestado este mes", "Emprestado este mês"],
    ["Collect today", "Ishyuza uyu munsi", "Kusanya leo", "À recouvrer aujourd'hui", "للتحصيل اليوم", "Cobrar hoy", "Cobrar hoje"],
    ["Nothing is due or overdue. 🎉 Enjoy the day.", "Nta kigomba kwishyurwa cyangwa cyarengeje igihe. 🎉 Gira umunsi mwiza.", "Hakuna kinachodaiwa wala kuchelewa. 🎉 Furahia siku.", "Rien à payer ni en retard. 🎉 Bonne journée.", "لا شيء مستحق أو متأخر. 🎉 استمتع بيومك.", "Nada vence ni está atrasado. 🎉 Disfruta el día.", "Nada vence nem está atrasado. 🎉 Aproveite o dia."],
    ["Show all {n}", "Erekana byose {n}", "Onyesha zote {n}", "Tout afficher ({n})", "عرض الكل ({n})", "Mostrar los {n}", "Mostrar todos ({n})"],
    ["Show less", "Erekana bike", "Onyesha kidogo", "Afficher moins", "عرض أقل", "Mostrar menos", "Mostrar menos"],
    ["Promises to pay", "Amasezerano yo kwishyura", "Ahadi za kulipa", "Promesses de paiement", "وعود الدفع", "Promesas de pago", "Promessas de pagamento"],
    ["Follow-ups for today", "Gukurikirana k'uyu munsi", "Ufuatiliaji wa leo", "Relances du jour", "متابعات اليوم", "Seguimientos de hoy", "Acompanhamentos de hoje"],
    ["Due soon", "Hagiye kugera igihe", "Inakaribia kudaiwa", "Bientôt dû", "يستحق قريبًا", "Vence pronto", "Vence em breve"],
    ["Recent payments", "Ibyishyuwe vuba", "Malipo ya hivi karibuni", "Paiements récents", "المدفوعات الأخيرة", "Pagos recientes", "Pagamentos recentes"],
    ["No payments yet.", "Nta kwishyura kurabaho.", "Bado hakuna malipo.", "Aucun paiement pour l'instant.", "لا مدفوعات بعد.", "Aún no hay pagos.", "Nenhum pagamento ainda."],
    ["Age of debts", "Igihe imyenda imaze", "Umri wa madeni", "Ancienneté des dettes", "عمر الديون", "Antigüedad de las deudas", "Idade das dívidas"],
    ["How many days past the due date. “current” is not yet due.", "Iminsi irenga itariki yo kwishyura. “current” ni itarageza igihe.", "Siku zilizopita baada ya tarehe ya kulipa. “current” bado haijafika.", "Jours après l'échéance. « current » = pas encore dû.", "عدد الأيام بعد تاريخ الاستحقاق. “current” لم يحن موعده بعد.", "Días tras el vencimiento. “current” aún no vence.", "Dias após o vencimento. “current” ainda não venceu."],
    ["Lent vs collected", "Byatijwe n'ibyishyuwe", "Zilizokopeshwa dhidi ya zilizokusanywa", "Prêté et encaissé", "المُقرَض مقابل المحصّل", "Prestado y cobrado", "Emprestado e recebido"],
    ["Lent", "Byatijwe", "Iliyokopeshwa", "Prêté", "مُقرَض", "Prestado", "Emprestado"],
    ["Collected", "Byishyuwe", "Iliyokusanywa", "Encaissé", "محصّل", "Cobrado", "Recebido"],
    ["Biggest balances", "Imyenda minini", "Salio kubwa zaidi", "Plus gros soldes", "أكبر الأرصدة", "Saldos más altos", "Maiores saldos"],
    ["Nobody owes you right now.", "Nta muntu ukwishyuzwa ubu.", "Hakuna anayekudai sasa.", "Personne ne vous doit rien.", "لا أحد مدين لك الآن.", "Nadie te debe ahora.", "Ninguém lhe deve agora."],
    ["Nobody owes you money.", "Nta muntu ukwishyuzwa amafaranga.", "Hakuna anayekudai pesa.", "Personne ne vous doit d'argent.", "لا أحد مدين لك بمال.", "Nadie te debe dinero.", "Ninguém lhe deve dinheiro."],
    ["Welcome to Depta 👋", "Murakaza neza kuri Depta 👋", "Karibu Depta 👋", "Bienvenue sur Depta 👋", "مرحبًا بك في Depta 👋", "Bienvenido a Depta 👋", "Bem-vindo ao Depta 👋"],
    ["Record who owes your shop, remind them, and collect every shilling. Start with your first customer.", "Andika abakwishyuzwa, ubibutse kandi wishyuze buri faranga. Tangirana n'umukiriya wa mbere.", "Rekodi nani anadaiwa duka lako, wakumbushe na kukusanya kila senti. Anza na mteja wa kwanza.", "Notez qui doit de l'argent à votre boutique, relancez et encaissez chaque centime. Commencez par votre premier client.", "سجّل من يدين لمتجرك وذكّره وحصّل كل مبلغ. ابدأ بأول عميل.", "Anota quién debe a tu tienda, recuérdaselo y cobra cada centavo. Empieza con tu primer cliente.", "Registre quem deve à sua loja, lembre e receba cada centavo. Comece com seu primeiro cliente."],
    ["Add first customer", "Ongeraho umukiriya wa mbere", "Ongeza mteja wa kwanza", "Ajouter un premier client", "أضف أول عميل", "Añadir primer cliente", "Adicionar primeiro cliente"],
    ["Call", "Hamagara", "Piga simu", "Appeler", "اتصال", "Llamar", "Ligar"],
    ["Remind", "Wibutse", "Kumbusha", "Rappeler", "تذكير", "Recordar", "Lembrar"],
    ["Collect", "Ishyuza", "Kusanya", "Encaisser", "تحصيل", "Cobrar", "Cobrar"],
    ["Credit", "Inguzanyo", "Mkopo", "Crédit", "ائتمان", "Crédito", "Crédito"],
    ["Debt", "Umwenda", "Deni", "Dette", "دين", "Deuda", "Dívida"],
    ["kept", "yubahirijwe", "imetimizwa", "tenue", "تم الوفاء", "cumplida", "cumprida"],
    ["broken", "yarenzwe", "imevunjwa", "non tenue", "نُكثت", "incumplida", "descumprida"],
    ["void", "yahagaritswe", "imefutwa", "annulé", "ملغى", "anulado", "anulado"],
    ["VOID", "YAHAGARITSWE", "IMEFUTWA", "ANNULÉ", "ملغى", "ANULADO", "ANULADO"],
    ["Overdue {n} days", "Byarengeje iminsi {n}", "Imechelewa siku {n}", "En retard de {n} jours", "متأخر {n} أيام", "Vencido {n} días", "Atrasado {n} dias"],
    ["Overdue {n} day", "Byarengeje umunsi {n}", "Imechelewa siku {n}", "En retard de {n} jour", "متأخر {n} يوم", "Vencido {n} día", "Atrasado {n} dia"],
    ["Due in {n} days", "Bizishyurwa mu minsi {n}", "Inadaiwa baada ya siku {n}", "Dû dans {n} jours", "يستحق بعد {n} أيام", "Vence en {n} días", "Vence em {n} dias"],
    ["Due tomorrow", "Bizishyurwa ejo", "Inadaiwa kesho", "Dû demain", "يستحق غدًا", "Vence mañana", "Vence amanhã"],
    ["Thank you for your payment.", "Murakoze kwishyura.", "Asante kwa malipo yako.", "Merci pour votre paiement.", "شكرًا لدفعتك.", "Gracias por tu pago.", "Obrigado pelo seu pagamento."],
    ["Statement", "Raporo y'konti", "Taarifa ya akaunti", "Relevé", "كشف حساب", "Estado de cuenta", "Extrato"],
    ["Owed to us", "Dukwiye kwishyurwa", "Tunadaiwa", "On nous doit", "المستحق لنا", "Nos deben", "Devem-nos"],
    ["Collected", "Byishyuwe", "Iliyokusanywa", "Encaissé", "محصّل", "Cobrado", "Recebido"],
    ["{n}-{n} days", "iminsi {n}-{n}", "siku {n}-{n}", "{n}-{n} jours", "{n}-{n} يومًا", "{n}-{n} días", "{n}-{n} dias"],
    ["{n}+ days", "iminsi {n}+", "siku {n}+", "{n}+ jours", "{n}+ يومًا", "{n}+ días", "{n}+ dias"],
    ["1-7 days", "iminsi 1-7", "siku 1-7", "1-7 jours", "1-7 أيام", "1-7 días", "1-7 dias"],
    ["current", "ubu", "sasa", "actuel", "حالي", "actual", "atual"],
    ["follow up", "gukurikirana", "fuatilia", "relance", "متابعة", "seguimiento", "acompanhar"],
    ["📴 You are offline – nothing will save until you reconnect", "📴 Nta murandasi – nta kintu kizabikwa kugeza wongeye guhuza", "📴 Huna mtandao – hakuna kitakachohifadhiwa hadi uunganishe tena", "📴 Vous êtes hors ligne – rien ne sera enregistré avant la reconnexion", "📴 أنت غير متصل – لن يُحفظ شيء حتى تعود للاتصال", "📴 Sin conexión – nada se guardará hasta reconectar", "📴 Você está offline – nada será salvo até reconectar"],
    ["e.g. Pay MTN 0772 000 000 (Mama Joy)", "urugero: Ishyura kuri MTN 0772 000 000 (Mama Joy)", "mfano: Lipa MTN 0772 000 000 (Mama Joy)", "ex. Payer MTN 0772 000 000 (Mama Joy)", "مثل: ادفع إلى MTN 0772 000 000 (Mama Joy)", "p. ej. Paga a MTN 0772 000 000 (Mama Joy)", "ex. Pague MTN 0772 000 000 (Mama Joy)"],
    ["pending", "bitegerejwe", "inasubiri", "en attente", "قيد الانتظار", "pendiente", "pendente"],
    // ---- states, risk, methods, kinds
    ["Due soon", "Hagiye kugera igihe", "Inakaribia kudaiwa", "Bientôt dû", "يستحق قريبًا", "Vence pronto", "Vence em breve"],
    ["Part-paid", "Byishyuwe igice", "Imelipwa nusu", "Partiellement payé", "مدفوع جزئيًا", "Pago parcial", "Pago parcial"],
    ["Paid", "Byishyuwe", "Imelipwa", "Payé", "مدفوع", "Pagado", "Pago"],
    ["Written off", "Byasibwe nk'igihombo", "Imefutwa kama hasara", "Passé en perte", "مشطوب", "Dado de baja", "Baixado"],
    ["Cancelled", "Byahagaritswe", "Imeghairiwa", "Annulé", "ملغى", "Cancelado", "Cancelado"],
    ["Good payer", "Umwishyuzi mwiza", "Mlipaji mzuri", "Bon payeur", "ملتزم بالدفع", "Buen pagador", "Bom pagador"],
    ["Good payers", "Abishyura neza", "Walipaji wazuri", "Bons payeurs", "الملتزمون", "Buenos pagadores", "Bons pagadores"],
    ["Watch", "Genzura", "Angalia", "À surveiller", "مراقبة", "Vigilar", "Atenção"],
    ["High risk", "Ibyago byinshi", "Hatari kubwa", "Risque élevé", "مخاطرة عالية", "Alto riesgo", "Alto risco"],
    ["New", "Mushya", "Mpya", "Nouveau", "جديد", "Nuevo", "Novo"],
    ["Cash", "Amafaranga y'intoki", "Pesa taslimu", "Espèces", "نقدًا", "Efectivo", "Dinheiro"],
    ["Mobile money", "Mobile Money", "Pesa ya simu", "Mobile money", "محفظة الجوال", "Dinero móvil", "Dinheiro móvel"],
    ["Mobile", "Mobile Money", "Simu", "Mobile", "جوال", "Móvil", "Celular"],
    ["Bank", "Banki", "Benki", "Banque", "بنك", "Banco", "Banco"],
    ["Card", "Ikarita", "Kadi", "Carte", "بطاقة", "Tarjeta", "Cartão"],
    ["Visit", "Gusura", "Tembelea", "Visite", "زيارة", "Visita", "Visita"],
    ["SMS", "SMS", "SMS", "SMS", "رسالة SMS", "SMS", "SMS"],
    ["Message", "Ubutumwa", "Ujumbe", "Message", "رسالة", "Mensaje", "Mensagem"],
    ["Promise", "Isezerano", "Ahadi", "Promesse", "وعد", "Promesa", "Promessa"],
    // ---- Debts / Customers lists
    ["Search name, item, phone", "Shakisha izina, igicuruzwa, telefoni", "Tafuta jina, bidhaa, simu", "Rechercher nom, article, téléphone", "ابحث بالاسم أو البند أو الهاتف", "Buscar nombre, artículo, teléfono", "Buscar nome, item, telefone"],
    ["Search name, phone, area", "Shakisha izina, telefoni, agace", "Tafuta jina, simu, eneo", "Rechercher nom, téléphone, quartier", "ابحث بالاسم أو الهاتف أو المنطقة", "Buscar nombre, teléfono, zona", "Buscar nome, telefone, bairro"],
    ["Search customer", "Shakisha umukiriya", "Tafuta mteja", "Rechercher un client", "ابحث عن عميل", "Buscar cliente", "Buscar cliente"],
    ["Most urgent", "Byihutirwa cyane", "Za dharura zaidi", "Plus urgent", "الأكثر إلحاحًا", "Más urgente", "Mais urgente"],
    ["Biggest", "Binini cyane", "Kubwa zaidi", "Plus gros", "الأكبر", "Más grande", "Maior"],
    ["Due date", "Itariki yo kwishyura", "Tarehe ya kulipa", "Échéance", "تاريخ الاستحقاق", "Vencimiento", "Vencimento"],
    ["Newest", "Bishya cyane", "Mpya zaidi", "Plus récent", "الأحدث", "Más reciente", "Mais recente"],
    ["{n} debts · balance", "Imyenda {n} · asigaye", "Madeni {n} · salio", "{n} dettes · solde", "{n} ديون · الرصيد", "{n} deudas · saldo", "{n} dívidas · saldo"],
    ["{n} debt · balance", "Umwenda {n} · asigaye", "Deni {n} · salio", "{n} dette · solde", "{n} دين · الرصيد", "{n} deuda · saldo", "{n} dívida · saldo"],
    ["{n} customers", "Abakiriya {n}", "Wateja {n}", "{n} clients", "{n} عملاء", "{n} clientes", "{n} clientes"],
    ["{n} customer", "Umukiriya {n}", "Mteja {n}", "{n} client", "{n} عميل", "{n} cliente", "{n} cliente"],
    ["No debts match. Tap ＋ to record one.", "Nta mwenda uboneka. Kanda ＋ kugira ngo wandike umwenda.", "Hakuna deni linalolingana. Gusa ＋ kurekodi.", "Aucune dette trouvée. Touchez ＋ pour en ajouter.", "لا توجد ديون مطابقة. اضغط ＋ لتسجيل دين.", "Sin deudas. Toca ＋ para registrar una.", "Nenhuma dívida. Toque em ＋ para registrar."],
    ["No debts yet.", "Nta mwenda urandikwa.", "Bado hakuna madeni.", "Aucune dette pour l'instant.", "لا ديون بعد.", "Aún no hay deudas.", "Nenhuma dívida ainda."],
    ["No customers yet.", "Nta bakiriya barandikwa.", "Bado hakuna wateja.", "Aucun client pour l'instant.", "لا عملاء بعد.", "Aún no hay clientes.", "Nenhum cliente ainda."],
    ["Owing", "Bafite imyenda", "Wanaodaiwa", "Débiteurs", "المدينون", "Con deuda", "Devedores"],
    ["Blocked", "Babujijwe", "Waliozuiwa", "Bloqués", "محظورون", "Bloqueados", "Bloqueados"],
    ["no phone", "nta telefoni", "hakuna simu", "pas de téléphone", "لا هاتف", "sin teléfono", "sem telefone"],
    ["Customer", "Umukiriya", "Mteja", "Client", "العميل", "Cliente", "Cliente"],
    // ---- Debt detail
    ["Balance to collect", "Asigaye yo kwishyuza", "Salio la kukusanya", "Solde à recouvrer", "الرصيد المطلوب تحصيله", "Saldo por cobrar", "Saldo a receber"],
    ["incl. late fee {x}", "harimo ihazabu {x}", "pamoja na faini {x}", "dont pénalité {x}", "شاملًا غرامة التأخير {x}", "incl. recargo {x}", "incl. multa {x}"],
    ["paid of", "byishyuwe muri", "imelipwa kati ya", "payé sur", "مدفوع من", "pagado de", "pago de"],
    ["Collect payment", "Akira ubwishyu", "Pokea malipo", "Encaisser un paiement", "تحصيل دفعة", "Cobrar pago", "Receber pagamento"],
    ["Promise to pay", "Isezerano ryo kwishyura", "Ahadi ya kulipa", "Promesse de paiement", "وعد بالدفع", "Promesa de pago", "Promessa de pagamento"],
    ["Log call / visit", "Andika guhamagara / gusura", "Rekodi simu / ziara", "Noter appel / visite", "تسجيل اتصال / زيارة", "Registrar llamada / visita", "Registrar ligação / visita"],
    ["Instalments", "Ibyiciro by'ubwishyu", "Awamu", "Échéances", "الأقساط", "Cuotas", "Parcelas"],
    ["Given", "Byatanzwe", "Ilitolewa", "Accordé", "تاريخ الإعطاء", "Entregado", "Entregue"],
    ["Next due", "Ikurikira yo kwishyura", "Inayofuata kulipwa", "Prochaine échéance", "الاستحقاق التالي", "Próximo vencimiento", "Próximo vencimento"],
    ["Due", "Igihe cyo kwishyura", "Inadaiwa", "Échéance", "الاستحقاق", "Vence", "Vence"],
    ["Amount lent", "Amafaranga yatijwe", "Kiasi kilichokopeshwa", "Montant prêté", "المبلغ المُقرَض", "Monto prestado", "Valor emprestado"],
    ["Interest", "Inyungu", "Riba", "Intérêt", "الفائدة", "Interés", "Juros"],
    ["Extra charges", "Amafaranga yiyongereyeho", "Gharama za ziada", "Frais supplémentaires", "رسوم إضافية", "Cargos extra", "Cobranças extras"],
    ["Discount given", "Igabanyirizwa ryatanzwe", "Punguzo lililotolewa", "Remise accordée", "الخصم الممنوح", "Descuento dado", "Desconto dado"],
    ["Late fee", "Ihazabu yo gutinda", "Faini ya kuchelewa", "Pénalité de retard", "غرامة التأخير", "Recargo por mora", "Multa por atraso"],
    ["a month", "ku kwezi", "kwa mwezi", "par mois", "شهريًا", "al mes", "ao mês"],
    ["now", "ubu", "sasa", "maintenant", "الآن", "ahora", "agora"],
    ["Security / pledge", "Ingwate", "Dhamana", "Garantie / gage", "الضمان / الرهن", "Garantía / prenda", "Garantia / penhor"],
    ["Security / pledge (optional)", "Ingwate (ntibiteganijwe)", "Dhamana (si lazima)", "Garantie / gage (facultatif)", "الضمان / الرهن (اختياري)", "Garantía / prenda (opcional)", "Garantia / penhor (opcional)"],
    ["e.g. TV, land title", "urugero: Televiziyo, impapuro z'ubutaka", "mfano: TV, hati ya kiwanja", "ex. TV, titre foncier", "مثل: تلفاز، سند أرض", "p. ej. TV, escritura", "ex. TV, escritura"],
    ["Written off:", "Byasibwe:", "Imefutwa:", "Passé en perte :", "مشطوب:", "Dado de baja:", "Baixado:"],
    ["Move due date", "Hindura itariki yo kwishyura", "Sogeza tarehe ya kulipa", "Reporter l'échéance", "تأجيل تاريخ الاستحقاق", "Mover vencimiento", "Mover vencimento"],
    ["Add charge", "Ongeraho amafaranga", "Ongeza gharama", "Ajouter des frais", "إضافة رسوم", "Añadir cargo", "Adicionar cobrança"],
    ["Add a charge", "Ongeraho amafaranga", "Ongeza gharama", "Ajouter des frais", "إضافة رسوم", "Añadir un cargo", "Adicionar uma cobrança"],
    ["Give discount", "Tanga igabanyirizwa", "Toa punguzo", "Accorder une remise", "منح خصم", "Dar descuento", "Dar desconto"],
    ["Give a discount", "Tanga igabanyirizwa", "Toa punguzo", "Accorder une remise", "منح خصم", "Dar un descuento", "Dar um desconto"],
    ["Write off", "Siba nk'igihombo", "Futa kama hasara", "Passer en perte", "شطب", "Dar de baja", "Baixar"],
    ["Write off as a loss", "Siba nk'igihombo", "Futa kama hasara", "Passer en perte", "شطب كخسارة", "Dar de baja como pérdida", "Baixar como perda"],
    ["Entered by mistake", "Byandikwe kubera ikosa", "Imeingizwa kimakosa", "Saisi par erreur", "أُدخل بالخطأ", "Ingresado por error", "Lançado por engano"],
    ["Reopen this debt", "Ongera ufungure uyu mwenda", "Fungua upya deni hili", "Rouvrir cette dette", "إعادة فتح هذا الدين", "Reabrir esta deuda", "Reabrir esta dívida"],
    ["received", "yakiriwe", "imepokelewa", "reçu", "مستلم", "recibido", "recebido"],
    ["SMS read", "SMS yasomwe", "SMS imesomwa", "SMS lu", "تمت قراءة الرسالة", "SMS leído", "SMS lido"],
    ["Receipt", "Inyemezabwishyu", "Risiti", "Reçu", "إيصال", "Recibo", "Recibo"],
    ["All unpaid instalments move by the same number of days.", "Ibyiciro byose bitarishyurwa bizimurwa ku minsi imwe.", "Awamu zote ambazo hazijalipwa zitasogezwa kwa idadi ileile ya siku.", "Toutes les échéances impayées sont décalées du même nombre de jours.", "تُؤجَّل كل الأقساط غير المدفوعة بنفس عدد الأيام.", "Todas las cuotas impagas se mueven los mismos días.", "Todas as parcelas em aberto são movidas pelo mesmo número de dias."],
    ["New due date", "Itariki nshya yo kwishyura", "Tarehe mpya ya kulipa", "Nouvelle échéance", "تاريخ الاستحقاق الجديد", "Nuevo vencimiento", "Novo vencimento"],
    ["Reason (optional)", "Impamvu (ntibiteganijwe)", "Sababu (si lazima)", "Raison (facultatif)", "السبب (اختياري)", "Motivo (opcional)", "Motivo (opcional)"],
    ["e.g. customer asked for a week", "urugero: umukiriya yasabye icyumweru", "mfano: mteja aliomba wiki moja", "ex. le client a demandé une semaine", "مثل: طلب العميل أسبوعًا", "p. ej. el cliente pidió una semana", "ex. cliente pediu uma semana"],
    ["Save new date", "Bika itariki nshya", "Hifadhi tarehe mpya", "Enregistrer la nouvelle date", "حفظ التاريخ الجديد", "Guardar nueva fecha", "Salvar nova data"],
    ["Adds money to what the customer owes (e.g. delivery, penalty).", "Yongera amafaranga umukiriya agomba kwishyura (urugero: gutwara, ihazabu).", "Inaongeza pesa kwa anachodaiwa mteja (mf. usafirishaji, faini).", "Ajoute de l'argent à ce que le client doit (ex. livraison, pénalité).", "يضيف مبلغًا إلى ما يدين به العميل (مثل التوصيل أو الغرامة).", "Suma dinero a lo que debe el cliente (p. ej. envío, multa).", "Soma dinheiro ao que o cliente deve (ex. entrega, multa)."],
    ["Amount to forgive", "Amafaranga yo kubabarira", "Kiasi cha kusamehe", "Montant à pardonner", "المبلغ المراد التنازل عنه", "Monto a perdonar", "Valor a perdoar"],
    ["Reduces what is owed (up to {x}). Not counted as a loss.", "Igabanya umwenda (ugeza kuri {x}). Ntibibarwa nk'igihombo.", "Hupunguza deni (hadi {x}). Haihesabiwi kama hasara.", "Réduit la dette (jusqu'à {x}). Non compté comme perte.", "يخفّض الدين (حتى {x}). لا يُحتسب كخسارة.", "Reduce lo adeudado (hasta {x}). No cuenta como pérdida.", "Reduz o que se deve (até {x}). Não conta como perda."],
    ["You will stop chasing {x}. You can reopen it later if the customer pays.", "Uzareka kwishyuza {x}. Ushobora kongera kuwufungura umukiriya nyuma yishyuye.", "Utaacha kudai {x}. Unaweza kuufungua tena mteja akilipa.", "Vous arrêterez de réclamer {x}. Vous pourrez rouvrir si le client paie.", "ستتوقف عن مطالبة {x}. يمكنك إعادة الفتح إن دفع العميل.", "Dejarás de reclamar {x}. Puedes reabrirla si el cliente paga.", "Você deixará de cobrar {x}. Pode reabrir se o cliente pagar."],
    ["e.g. customer moved away", "urugero: umukiriya yimutse", "mfano: mteja amehama", "ex. le client a déménagé", "مثل: انتقل العميل", "p. ej. el cliente se mudó", "ex. cliente se mudou"],
    ["Edit debt", "Hindura umwenda", "Hariri deni", "Modifier la dette", "تعديل الدين", "Editar deuda", "Editar dívida"],
    ["Item / reason", "Igicuruzwa / impamvu", "Bidhaa / sababu", "Article / motif", "البند / السبب", "Artículo / motivo", "Item / motivo"],
    ["Interest %", "Inyungu %", "Riba %", "Intérêt %", "الفائدة %", "Interés %", "Juros %"],
    ["Late fee % per month", "Ihazabu % ku kwezi", "Faini % kwa mwezi", "Pénalité % par mois", "غرامة التأخير % شهريًا", "Recargo % por mes", "Multa % ao mês"],
    ["Date given", "Itariki yatangiwe", "Tarehe ya kutoa", "Date d'octroi", "تاريخ الإعطاء", "Fecha de entrega", "Data de entrega"],
    ["Due date", "Itariki yo kwishyura", "Tarehe ya kulipa", "Échéance", "تاريخ الاستحقاق", "Vencimiento", "Vencimento"],
    ["Customer not found", "Umukiriya ntaboneka", "Mteja hajapatikana", "Client introuvable", "العميل غير موجود", "Cliente no encontrado", "Cliente não encontrado"],
    ["Debt not found", "Umwenda ntuboneka", "Deni halijapatikana", "Dette introuvable", "الدين غير موجود", "Deuda no encontrada", "Dívida não encontrada"],
    // ---- reminders & follow-ups
    ["Pick a tone, edit if you like, then send. It opens WhatsApp or your SMS app – you press send.", "Hitamo imvugo, uhindure niba ubishaka, hanyuma wohereze. Bifungura WhatsApp cyangwa SMS – ukanda kohereza.", "Chagua mtindo, hariri ukipenda, kisha tuma. Inafungua WhatsApp au SMS – wewe unabonyeza tuma.", "Choisissez un ton, modifiez si besoin, puis envoyez. Cela ouvre WhatsApp ou SMS – vous appuyez sur envoyer.", "اختر النبرة وعدّل إن شئت ثم أرسل. يفتح واتساب أو الرسائل – وأنت تضغط إرسال.", "Elige un tono, edita si quieres y envía. Se abre WhatsApp o SMS – tú pulsas enviar.", "Escolha o tom, edite se quiser e envie. Abre o WhatsApp ou SMS – você toca em enviar."],
    ["Friendly", "Ubugwaneza", "Kirafiki", "Amical", "ودّي", "Amable", "Amigável"],
    ["Firm", "Gukomera", "Thabiti", "Ferme", "حازم", "Firme", "Firme"],
    ["Final notice", "Integuza ya nyuma", "Notisi ya mwisho", "Dernier avis", "إشعار أخير", "Aviso final", "Aviso final"],
    ["Thank you", "Murakoze", "Asante", "Merci", "شكرًا", "Gracias", "Obrigado"],
    ["WhatsApp", "WhatsApp", "WhatsApp", "WhatsApp", "واتساب", "WhatsApp", "WhatsApp"],
    ["Copy message", "Koporora ubutumwa", "Nakili ujumbe", "Copier le message", "نسخ الرسالة", "Copiar mensaje", "Copiar mensagem"],
    ["No phone saved – WhatsApp will ask you to pick a contact.", "Nta telefoni yabitswe – WhatsApp izagusaba guhitamo umuntu.", "Hakuna simu iliyohifadhiwa – WhatsApp itakuomba uchague mwasiliani.", "Pas de téléphone – WhatsApp vous demandera un contact.", "لا يوجد هاتف – سيطلب واتساب اختيار جهة اتصال.", "Sin teléfono – WhatsApp te pedirá un contacto.", "Sem telefone – o WhatsApp pedirá um contato."],
    ["Log for", "Andika kuri", "Rekodi kwa", "Noter pour", "تسجيل لـ", "Registrar para", "Registrar para"],
    ["Promised to pay on", "Yasezeranyije kwishyura ku", "Aliahidi kulipa tarehe", "A promis de payer le", "وعد بالدفع في", "Prometió pagar el", "Prometeu pagar em"],
    ["Promised amount", "Amafaranga yasezeranyije", "Kiasi alichoahidi", "Montant promis", "المبلغ الموعود", "Monto prometido", "Valor prometido"],
    ["Promised {x} by {y}", "Yasezeranyije {x} bitarenze {y}", "Aliahidi {x} kufikia {y}", "A promis {x} avant le {y}", "وعد بـ {x} قبل {y}", "Prometió {x} para el {y}", "Prometeu {x} até {y}"],
    ["What happened?", "Byagenze bite?", "Nini kilitokea?", "Que s'est-il passé ?", "ماذا حدث؟", "¿Qué pasó?", "O que aconteceu?"],
    ["e.g. Said he will pay after market day", "urugero: Yavuze ko azishyura nyuma y'isoko", "mfano: Alisema atalipa baada ya siku ya soko", "ex. Dit qu'il paiera après le marché", "مثل: قال إنه سيدفع بعد يوم السوق", "p. ej. Dijo que pagará tras el mercado", "ex. Disse que paga depois da feira"],
    ["Remind me to follow up on (optional)", "Nyibutsa gukurikirana ku (ntibiteganijwe)", "Nikumbushe kufuatilia tarehe (si lazima)", "Me rappeler de relancer le (facultatif)", "ذكّرني بالمتابعة في (اختياري)", "Recuérdame hacer seguimiento el (opcional)", "Lembrar-me de acompanhar em (opcional)"],
    ["Promise saved – I will tell you if it is kept", "Isezerano ribitswe – nzakubwira niba ryubahirijwe", "Ahadi imehifadhiwa – nitakuambia ikitimizwa", "Promesse enregistrée – je vous dirai si elle est tenue", "تم حفظ الوعد – سأخبرك إن تم الوفاء به", "Promesa guardada – te avisaré si se cumple", "Promessa salva – aviso se for cumprida"],
    ["Marked done", "Byashyizweho ko byarangiye", "Imewekwa kuwa imekamilika", "Marqué comme fait", "تم وضع علامة منجز", "Marcado como hecho", "Marcado como concluído"],
    ["Recent contact", "Itumanaho rya vuba", "Mawasiliano ya hivi karibuni", "Contacts récents", "اتصالات حديثة", "Contactos recientes", "Contatos recentes"],
    // ---- collect payment
    ["Collect from", "Akira kuri", "Pokea kutoka kwa", "Encaisser auprès de", "تحصيل من", "Cobrar a", "Receber de"],
    ["Spread over their debts, oldest due date first ·", "Bigabanywa ku myenda yabo, uwa kera ujya imbere ·", "Inagawanywa kwenye madeni yao, la zamani kwanza ·", "Réparti sur ses dettes, la plus ancienne d'abord ·", "يُوزَّع على ديونه، الأقدم أولًا ·", "Se reparte entre sus deudas, la más antigua primero ·", "Distribuído entre as dívidas, a mais antiga primeiro ·"],
    ["owes", "afite umwenda wa", "anadaiwa", "doit", "مدين بـ", "debe", "deve"],
    ["Amount received", "Amafaranga yakiriwe", "Kiasi kilichopokelewa", "Montant reçu", "المبلغ المستلم", "Monto recibido", "Valor recebido"],
    ["Full", "Yose", "Yote", "Tout", "كامل", "Todo", "Tudo"],
    ["Half", "Kimwe cya kabiri", "Nusu", "Moitié", "نصف", "Mitad", "Metade"],
    ["Paid by", "Byishyuwe binyuze", "Imelipwa kwa", "Payé par", "طريقة الدفع", "Pagado con", "Pago por"],
    ["Transaction code", "Kode y'igikorwa", "Msimbo wa muamala", "Code de transaction", "رمز المعاملة", "Código de transacción", "Código da transação"],
    ["Or paste the payment SMS", "Cyangwa shyiramo SMS y'ubwishyu", "Au bandika SMS ya malipo", "Ou collez le SMS de paiement", "أو الصق رسالة الدفع", "O pega el SMS del pago", "Ou cole o SMS do pagamento"],
    ["Paste the message – I read the amount and code for you", "Shyiramo ubutumwa – nzasoma amafaranga na kode", "Bandika ujumbe – nitasoma kiasi na msimbo", "Collez le message – je lis le montant et le code", "الصق الرسالة – سأقرأ المبلغ والرمز", "Pega el mensaje – leo el monto y el código", "Cole a mensagem – leio o valor e o código"],
    ["Read & check SMS", "Soma kandi usuzume SMS", "Soma na kagua SMS", "Lire et vérifier le SMS", "قراءة والتحقق من الرسالة", "Leer y comprobar SMS", "Ler e verificar SMS"],
    ["Reference / slip number", "Nomero y'indango / ya sipi", "Rejea / nambari ya slip", "Référence / n° de bordereau", "المرجع / رقم الإيصال", "Referencia / n.º de comprobante", "Referência / nº do comprovante"],
    ["Note (optional)", "Icyitonderwa (ntibiteganijwe)", "Maelezo (si lazima)", "Note (facultatif)", "ملاحظة (اختياري)", "Nota (opcional)", "Nota (opcional)"],
    ["Paid on a different day?", "Byishyuwe ku munsi utandukanye?", "Ililipwa siku nyingine?", "Payé un autre jour ?", "دُفع في يوم آخر؟", "¿Pagado otro día?", "Pago em outro dia?"],
    ["Date received", "Itariki byakiriwe", "Tarehe ya kupokea", "Date de réception", "تاريخ الاستلام", "Fecha de recepción", "Data de recebimento"],
    ["Record payment", "Andika ubwishyu", "Rekodi malipo", "Enregistrer le paiement", "تسجيل الدفعة", "Registrar pago", "Registrar pagamento"],
    ["Nothing is owed here", "Nta mwenda uhari", "Hakuna deni hapa", "Rien n'est dû ici", "لا شيء مستحق هنا", "Aquí no se debe nada", "Nada é devido aqui"],
    ["Payment recorded ✅", "Ubwishyu bwanditswe ✅", "Malipo yamerekodiwa ✅", "Paiement enregistré ✅", "تم تسجيل الدفعة ✅", "Pago registrado ✅", "Pagamento registrado ✅"],
    ["Balance left:", "Asigaye:", "Salio lililobaki:", "Solde restant :", "الرصيد المتبقي:", "Saldo restante:", "Saldo restante:"],
    ["Send to customer", "Ohereza umukiriya", "Tuma kwa mteja", "Envoyer au client", "إرسال للعميل", "Enviar al cliente", "Enviar ao cliente"],
    ["Payment receipt", "Inyemezabwishyu", "Risiti ya malipo", "Reçu de paiement", "إيصال دفع", "Recibo de pago", "Recibo de pagamento"],
    ["Received from", "Yakiriwe kuri", "Imepokelewa kutoka kwa", "Reçu de", "مستلم من", "Recibido de", "Recebido de"],
    ["Balance remaining:", "Asigaye:", "Salio lililobaki:", "Solde restant :", "الرصيد المتبقي:", "Saldo restante:", "Saldo restante:"],
    ["Received:", "Byakiriwe:", "Imepokelewa:", "Reçu :", "المستلم:", "Recibido:", "Recebido:"],
    ["Customer:", "Umukiriya:", "Mteja:", "Client :", "العميل:", "Cliente:", "Cliente:"],
    ["Date:", "Itariki:", "Tarehe:", "Date :", "التاريخ:", "Fecha:", "Data:"],
    ["Payment not found.", "Ubwishyu ntibuboneka.", "Malipo hayajapatikana.", "Paiement introuvable.", "الدفعة غير موجودة.", "Pago no encontrado.", "Pagamento não encontrado."],
    // ---- New debt
    ["New debt", "Umwenda mushya", "Deni jipya", "Nouvelle dette", "دين جديد", "Nueva deuda", "Nova dívida"],
    ["Record a debt", "Andika umwenda", "Rekodi deni", "Enregistrer une dette", "تسجيل دين", "Registrar una deuda", "Registrar uma dívida"],
    ["Collect a payment", "Akira ubwishyu", "Pokea malipo", "Encaisser un paiement", "تحصيل دفعة", "Cobrar un pago", "Receber um pagamento"],
    ["New customer…", "Umukiriya mushya…", "Mteja mpya…", "Nouveau client…", "عميل جديد…", "Cliente nuevo…", "Novo cliente…"],
    ["New customer", "Umukiriya mushya", "Mteja mpya", "Nouveau client", "عميل جديد", "Cliente nuevo", "Novo cliente"],
    ["Customer name", "Izina ry'umukiriya", "Jina la mteja", "Nom du client", "اسم العميل", "Nombre del cliente", "Nome do cliente"],
    ["What was taken? (item / reason)", "Hatwawe iki? (igicuruzwa / impamvu)", "Kilichochukuliwa ni nini? (bidhaa / sababu)", "Qu'a-t-il pris ? (article / motif)", "ماذا أُخذ؟ (البند / السبب)", "¿Qué se llevó? (artículo / motivo)", "O que levou? (item / motivo)"],
    ["e.g. 2 bags of rice", "urugero: ibiro 2 by'umuceri", "mfano: magunia 2 ya mchele", "ex. 2 sacs de riz", "مثل: كيسان من الأرز", "p. ej. 2 sacos de arroz", "ex. 2 sacos de arroz"],
    ["Amount owed", "Amafaranga yishyuzwa", "Kiasi kinachodaiwa", "Montant dû", "المبلغ المستحق", "Monto adeudado", "Valor devido"],
    ["Paid now as deposit (optional)", "Yishyuwe ubu nk'avansi (ntibiteganijwe)", "Iliyolipwa sasa kama amana (si lazima)", "Acompte payé maintenant (facultatif)", "مدفوع الآن كعربون (اختياري)", "Anticipo pagado ahora (opcional)", "Entrada paga agora (opcional)"],
    ["+7 days", "+iminsi 7", "+siku 7", "+7 jours", "+7 أيام", "+7 días", "+7 dias"],
    ["+14", "+14", "+14", "+14", "+14", "+14", "+14"],
    ["How will they pay?", "Bazishyura bate?", "Watalipaje?", "Comment paiera-t-il ?", "كيف سيدفع؟", "¿Cómo pagará?", "Como vai pagar?"],
    ["One payment on the due date", "Ubwishyu bumwe ku itariki yagenwe", "Malipo moja siku ya kulipa", "Un paiement à l'échéance", "دفعة واحدة في تاريخ الاستحقاق", "Un pago en la fecha", "Um pagamento no vencimento"],
    ["{n} instalments", "Ibyiciro {n}", "Awamu {n}", "{n} échéances", "{n} أقساط", "{n} cuotas", "{n} parcelas"],
    ["Every", "Buri", "Kila", "Chaque", "كل", "Cada", "A cada"],
    ["2 weeks", "Ibyumweru 2", "Wiki 2", "2 semaines", "أسبوعان", "2 semanas", "2 semanas"],
    ["First instalment", "Icyiciro cya mbere", "Awamu ya kwanza", "Première échéance", "القسط الأول", "Primera cuota", "Primeira parcela"],
    ["Interest % (once)", "Inyungu % (rimwe)", "Riba % (mara moja)", "Intérêt % (une fois)", "الفائدة % (مرة واحدة)", "Interés % (una vez)", "Juros % (uma vez)"],
    ["Late fee % / month", "Ihazabu % / ukwezi", "Faini % / mwezi", "Pénalité % / mois", "غرامة التأخير % / شهر", "Recargo % / mes", "Multa % / mês"],
    ["Enter the amount to see the total.", "Andika amafaranga urebe yose hamwe.", "Weka kiasi uone jumla.", "Saisissez le montant pour voir le total.", "أدخل المبلغ لرؤية الإجمالي.", "Escribe el monto para ver el total.", "Digite o valor para ver o total."],
    ["Total to collect:", "Yose yo kwishyuza:", "Jumla ya kukusanya:", "Total à recouvrer :", "الإجمالي المطلوب:", "Total a cobrar:", "Total a receber:"],
    ["after deposit", "nyuma y'avansi", "baada ya amana", "après acompte", "بعد العربون", "tras el anticipo", "após a entrada"],
    ["each", "buri kimwe", "kila moja", "chacune", "لكل قسط", "cada una", "cada"],
    ["about", "hafi ya", "takriban", "environ", "حوالي", "aprox.", "cerca de"],
    ["Credit limit", "Ikirenga cy'inguzanyo", "Kikomo cha mkopo", "Plafond de crédit", "حد الائتمان", "Límite de crédito", "Limite de crédito"],
    ["already owes", "asanzwe yishyuzwa", "tayari anadaiwa", "doit déjà", "مدين بالفعل", "ya debe", "já deve"],
    ["This customer is blocked from credit.", "Uyu mukiriya yabujijwe inguzanyo.", "Mteja huyu amezuiwa mkopo.", "Ce client est bloqué pour le crédit.", "هذا العميل محظور من الائتمان.", "Este cliente está bloqueado para crédito.", "Este cliente está bloqueado para crédito."],
    ["Reference / invoice no.", "Nomero y'indango / fagitire", "Rejea / nambari ya ankara", "Référence / n° de facture", "المرجع / رقم الفاتورة", "Referencia / n.º de factura", "Referência / nº da fatura"],
    ["Save debt", "Bika umwenda", "Hifadhi deni", "Enregistrer la dette", "حفظ الدين", "Guardar deuda", "Salvar dívida"],
    ["Debt saved", "Umwenda wabitswe", "Deni limehifadhiwa", "Dette enregistrée", "تم حفظ الدين", "Deuda guardada", "Dívida salva"],
    ["Choose the customer first.", "Banza uhitemo umukiriya.", "Chagua mteja kwanza.", "Choisissez d'abord le client.", "اختر العميل أولًا.", "Elige primero al cliente.", "Escolha o cliente primeiro."],
    // ---- customer form + sheet
    ["Edit customer", "Hindura umukiriya", "Hariri mteja", "Modifier le client", "تعديل العميل", "Editar cliente", "Editar cliente"],
    ["Second phone (optional)", "Telefoni ya kabiri (ntibiteganijwe)", "Simu ya pili (si lazima)", "Second téléphone (facultatif)", "هاتف ثانٍ (اختياري)", "Segundo teléfono (opcional)", "Segundo telefone (opcional)"],
    ["Home / shop address", "Aho atuye / iduka rye", "Anwani ya nyumbani / duka", "Adresse domicile / boutique", "عنوان المنزل / المتجر", "Dirección de casa / tienda", "Endereço de casa / loja"],
    ["ID number (optional)", "Nomero y'indangamuntu (ntibiteganijwe)", "Nambari ya kitambulisho (si lazima)", "N° d'identité (facultatif)", "رقم الهوية (اختياري)", "N.º de identificación (opcional)", "Nº de identidade (opcional)"],
    ["ID number", "Nomero y'indangamuntu", "Nambari ya kitambulisho", "N° d'identité", "رقم الهوية", "N.º de identificación", "Nº de identidade"],
    ["Guarantor name", "Izina ry'umwishingizi", "Jina la mdhamini", "Nom du garant", "اسم الكفيل", "Nombre del garante", "Nome do fiador"],
    ["Guarantor phone", "Telefoni y'umwishingizi", "Simu ya mdhamini", "Téléphone du garant", "هاتف الكفيل", "Teléfono del garante", "Telefone do fiador"],
    ["Guarantor", "Umwishingizi", "Mdhamini", "Garant", "الكفيل", "Garante", "Fiador"],
    ["Credit limit (0 = none)", "Ikirenga cy'inguzanyo (0 = nta kirenga)", "Kikomo cha mkopo (0 = hakuna)", "Plafond de crédit (0 = aucun)", "حد الائتمان (0 = بلا حد)", "Límite de crédito (0 = ninguno)", "Limite de crédito (0 = nenhum)"],
    ["Group / tag", "Itsinda / ikirango", "Kundi / lebo", "Groupe / étiquette", "مجموعة / وسم", "Grupo / etiqueta", "Grupo / etiqueta"],
    ["e.g. school, taxi", "urugero: ishuri, tagisi", "mfano: shule, teksi", "ex. école, taxi", "مثل: مدرسة، تاكسي", "p. ej. escuela, taxi", "ex. escola, táxi"],
    ["Save customer", "Bika umukiriya", "Hifadhi mteja", "Enregistrer le client", "حفظ العميل", "Guardar cliente", "Salvar cliente"],
    ["Owes", "Afite umwenda", "Anadaiwa", "Doit", "مدين بـ", "Debe", "Deve"],
    ["Total lent", "Byose byatijwe", "Jumla iliyokopeshwa", "Total prêté", "إجمالي المُقرَض", "Total prestado", "Total emprestado"],
    ["Total paid", "Byose byishyuwe", "Jumla iliyolipwa", "Total payé", "إجمالي المدفوع", "Total pagado", "Total pago"],
    ["Trust score", "Amanota y'ubwizerwe", "Alama ya uaminifu", "Score de confiance", "درجة الثقة", "Puntaje de confianza", "Pontuação de confiança"],
    ["broken promise", "isezerano ryarenzwe", "ahadi iliyovunjwa", "promesse non tenue", "وعد منكوث", "promesa incumplida", "promessa descumprida"],
    ["broken promises", "amasezerano yarenzwe", "ahadi zilizovunjwa", "promesses non tenues", "وعود منكوثة", "promesas incumplidas", "promessas descumpridas"],
    ["last paid", "uheruka kwishyura", "alilipa mwisho", "dernier paiement", "آخر دفعة", "último pago", "último pagamento"],
    ["Credit used", "Inguzanyo yakoreshejwe", "Mkopo uliotumika", "Crédit utilisé", "الائتمان المستخدم", "Crédito usado", "Crédito usado"],
    ["Chat", "Ganira", "Ongea", "Discuter", "محادثة", "Chatear", "Conversar"],
    ["Log contact", "Andika itumanaho", "Rekodi mawasiliano", "Noter un contact", "تسجيل اتصال", "Registrar contacto", "Registrar contato"],
    ["Statement", "Raporo y'konti", "Taarifa ya akaunti", "Relevé", "كشف حساب", "Estado de cuenta", "Extrato"],
    ["Block new credit", "Hagarika inguzanyo nshya", "Zuia mkopo mpya", "Bloquer le crédit", "حظر ائتمان جديد", "Bloquear nuevo crédito", "Bloquear novo crédito"],
    ["Allow credit again", "Emerera inguzanyo ukundi", "Ruhusu mkopo tena", "Autoriser à nouveau le crédit", "السماح بالائتمان مجددًا", "Permitir crédito otra vez", "Permitir crédito novamente"],
    ["Archive", "Bika mu bubiko", "Hifadhi kwenye kumbukumbu", "Archiver", "أرشفة", "Archivar", "Arquivar"],
    ["Customer blocked from new credit", "Umukiriya yabujijwe inguzanyo nshya", "Mteja amezuiwa mkopo mpya", "Client bloqué pour le crédit", "تم حظر العميل من ائتمان جديد", "Cliente bloqueado para nuevo crédito", "Cliente bloqueado para novo crédito"],
    ["Credit allowed again", "Inguzanyo yongeye kwemerwa", "Mkopo umeruhusiwa tena", "Crédit de nouveau autorisé", "تم السماح بالائتمان مجددًا", "Crédito permitido de nuevo", "Crédito permitido novamente"],
    ["Statement of account · {x}", "Raporo y'konti · {x}", "Taarifa ya akaunti · {x}", "Relevé de compte · {x}", "كشف حساب · {x}", "Estado de cuenta · {x}", "Extrato de conta · {x}"],
    ["Statement of account", "Raporo y'konti", "Taarifa ya akaunti", "Relevé de compte", "كشف حساب", "Estado de cuenta", "Extrato de conta"],
    ["Total owed", "Yose yishyuzwa", "Jumla inayodaiwa", "Total dû", "إجمالي المستحق", "Total adeudado", "Total devido"],
    ["Total owed:", "Yose yishyuzwa:", "Jumla inayodaiwa:", "Total dû :", "إجمالي المستحق:", "Total adeudado:", "Total devido:"],
    ["Payments received", "Ubwishyu bwakiriwe", "Malipo yaliyopokelewa", "Paiements reçus", "المدفوعات المستلمة", "Pagos recibidos", "Pagamentos recebidos"],
    ["Payments", "Ubwishyu", "Malipo", "Paiements", "المدفوعات", "Pagos", "Pagamentos"],
    ["Who paid?", "Ni nde wishyuye?", "Nani amelipa?", "Qui a payé ?", "من دفع؟", "¿Quién pagó?", "Quem pagou?"],
    ["Archive this customer? They disappear from your lists (history is kept).", "Kubika uyu mukiriya mu bubiko? Ntazongera kugaragara ku rutonde (amateka arabikwa).", "Hifadhi mteja huyu kwenye kumbukumbu? Hataonekana kwenye orodha (historia inabaki).", "Archiver ce client ? Il disparaît des listes (l'historique est conservé).", "أرشفة هذا العميل؟ سيختفي من القوائم (يبقى السجل).", "¿Archivar este cliente? Desaparece de tus listas (se conserva el historial).", "Arquivar este cliente? Ele some das listas (o histórico é mantido)."],
    ["Remove this debt? Use this only if it was entered by mistake.", "Gukuraho uyu mwenda? Koresha ibi gusa niba wanditswe kubera ikosa.", "Ondoa deni hili? Tumia hii tu kama liliingizwa kimakosa.", "Supprimer cette dette ? Seulement si saisie par erreur.", "حذف هذا الدين؟ فقط إذا أُدخل بالخطأ.", "¿Quitar esta deuda? Solo si se ingresó por error.", "Remover esta dívida? Só se foi lançada por engano."],
    ["Why undo this payment?", "Kuki usubiza inyuma ubu bwishyu?", "Kwa nini kutendua malipo haya?", "Pourquoi annuler ce paiement ?", "لماذا تريد التراجع عن هذه الدفعة؟", "¿Por qué deshacer este pago?", "Por que desfazer este pagamento?"],
    // ---- Reports
    ["Report period", "Igihe cya raporo", "Kipindi cha ripoti", "Période du rapport", "فترة التقرير", "Período del informe", "Período do relatório"],
    ["7 days", "Iminsi 7", "Siku 7", "7 jours", "7 أيام", "7 días", "7 dias"],
    ["This month", "Uku kwezi", "Mwezi huu", "Ce mois-ci", "هذا الشهر", "Este mes", "Este mês"],
    ["90 days", "Iminsi 90", "Siku 90", "90 jours", "90 يومًا", "90 días", "90 dias"],
    ["This year", "Uyu mwaka", "Mwaka huu", "Cette année", "هذه السنة", "Este año", "Este ano"],
    ["Show report", "Erekana raporo", "Onyesha ripoti", "Afficher le rapport", "عرض التقرير", "Mostrar informe", "Mostrar relatório"],
    ["New debts lent", "Imyenda mishya yatijwe", "Madeni mapya yaliyokopeshwa", "Nouvelles dettes accordées", "ديون جديدة مُقرَضة", "Nuevas deudas prestadas", "Novas dívidas concedidas"],
    ["Collected by day", "Byishyuwe ku munsi", "Iliyokusanywa kwa siku", "Encaissé par jour", "المحصّل حسب اليوم", "Cobrado por día", "Recebido por dia"],
    ["How customers paid", "Uko abakiriya bishyuye", "Jinsi wateja walivyolipa", "Comment les clients ont payé", "كيف دفع العملاء", "Cómo pagaron los clientes", "Como os clientes pagaram"],
    ["No payments in this period.", "Nta bwishyu muri iki gihe.", "Hakuna malipo kwenye kipindi hiki.", "Aucun paiement sur cette période.", "لا مدفوعات في هذه الفترة.", "Sin pagos en este período.", "Sem pagamentos neste período."],
    ["Days overdue", "Iminsi yarengeje", "Siku zilizochelewa", "Jours de retard", "أيام التأخير", "Días de atraso", "Dias de atraso"],
    ["Not yet due", "Itaragera", "Bado haijafika", "Pas encore dû", "لم يحن موعده", "Aún no vence", "Ainda não venceu"],
    ["Download & print", "Manura & priinta", "Pakua & chapisha", "Télécharger & imprimer", "تنزيل وطباعة", "Descargar e imprimir", "Baixar e imprimir"],
    ["Debts (CSV)", "Imyenda (CSV)", "Madeni (CSV)", "Dettes (CSV)", "الديون (CSV)", "Deudas (CSV)", "Dívidas (CSV)"],
    ["Payments (CSV)", "Ubwishyu (CSV)", "Malipo (CSV)", "Paiements (CSV)", "المدفوعات (CSV)", "Pagos (CSV)", "Pagamentos (CSV)"],
    ["Customers (CSV)", "Abakiriya (CSV)", "Wateja (CSV)", "Clients (CSV)", "العملاء (CSV)", "Clientes (CSV)", "Clientes (CSV)"],
    ["Full backup", "Kubika byose", "Hifadhi nakala kamili", "Sauvegarde complète", "نسخة احتياطية كاملة", "Copia de seguridad completa", "Backup completo"],
    ["Print report", "Priinta raporo", "Chapisha ripoti", "Imprimer le rapport", "طباعة التقرير", "Imprimir informe", "Imprimir relatório"],
    ["CSV files open in Excel and Google Sheets.", "Dosiye za CSV zifungurwa muri Excel na Google Sheets.", "Faili za CSV hufunguka kwenye Excel na Google Sheets.", "Les fichiers CSV s'ouvrent dans Excel et Google Sheets.", "تُفتح ملفات CSV في Excel وGoogle Sheets.", "Los CSV se abren en Excel y Google Sheets.", "Arquivos CSV abrem no Excel e Google Sheets."],
    ["debt report", "raporo y'imyenda", "ripoti ya madeni", "rapport des dettes", "تقرير الديون", "informe de deudas", "relatório de dívidas"],
    ["Customers owing", "Abakiriya bafite imyenda", "Wateja wanaodaiwa", "Clients débiteurs", "العملاء المدينون", "Clientes con deuda", "Clientes devedores"],
    ["Recovered", "Byagaruwe", "Imerudishwa", "Récupéré", "المُستردّ", "Recuperado", "Recuperado"],
    // ---- Settings
    ["Connect to CTone", "Huza na CTone", "Unganisha na CTone", "Se connecter à CTone", "الربط مع CTone", "Conectar con CTone", "Conectar ao CTone"],
    ["Connected to CTone", "Wahujwe na CTone", "Imeunganishwa na CTone", "Connecté à CTone", "متصل بـ CTone", "Conectado a CTone", "Conectado ao CTone"],
    ["Connected to CTone ✅", "Wahujwe na CTone ✅", "Imeunganishwa na CTone ✅", "Connecté à CTone ✅", "تم الاتصال بـ CTone ✅", "Conectado a CTone ✅", "Conectado ao CTone ✅"],
    ["Depta works fine on its own. If you also use CTone, connect it to see your debts inside CTone. You enter your CTone email and password once – they are not saved here.", "Depta ikora yonyine neza. Niba ukoresha na CTone, uyihuze kugira ngo ubone imyenda yawe muri CTone. Wandika imeri n'ijambo ry'ibanga bya CTone rimwe gusa – ntibibikwa hano.", "Depta inafanya kazi yenyewe vizuri. Kama unatumia CTone pia, iunganishe uone madeni yako ndani ya CTone. Unaingiza barua pepe na nenosiri la CTone mara moja – hazihifadhiwi hapa.", "Depta fonctionne très bien seul. Si vous utilisez aussi CTone, connectez-le pour voir vos dettes dans CTone. Vous saisissez votre e-mail et mot de passe CTone une fois – ils ne sont pas enregistrés ici.", "يعمل Depta جيدًا بمفرده. إن كنت تستخدم CTone أيضًا فاربطه لترى ديونك داخله. تُدخل بريد CTone وكلمة مروره مرة واحدة – ولا تُحفظ هنا.", "Depta funciona bien solo. Si también usas CTone, conéctalo para ver tus deudas allí. Introduces tu correo y contraseña de CTone una vez – no se guardan aquí.", "O Depta funciona bem sozinho. Se você também usa o CTone, conecte para ver suas dívidas lá. Você informa e-mail e senha do CTone uma vez – não ficam salvos aqui."],
    ["Linked to your CTone shop", "Yahujwe n'iduka ryawe rya CTone", "Imeunganishwa na duka lako la CTone", "Lié à votre boutique CTone", "مرتبط بمتجرك في CTone", "Vinculado a tu tienda CTone", "Vinculado à sua loja CTone"],
    [". Depta still works on its own – this only shares your debts with CTone.", ". Depta iracyakora yonyine – ibi bisangiza gusa imyenda yawe na CTone.", ". Depta bado inafanya kazi yenyewe – hii inashiriki madeni yako na CTone tu.", ". Depta fonctionne toujours seul – cela ne fait que partager vos dettes avec CTone.", ". يظل Depta يعمل بمفرده – هذا يشارك ديونك مع CTone فقط.", ". Depta sigue funcionando solo – esto solo comparte tus deudas con CTone.", ". O Depta continua funcionando sozinho – isso só compartilha suas dívidas com o CTone."],
    ["Last synced", "Ihuzwa riheruka", "Ilisawazishwa mwisho", "Dernière synchro", "آخر مزامنة", "Última sincronización", "Última sincronização"],
    ["Not synced yet", "Ntirahuzwa", "Bado haijasawazishwa", "Pas encore synchronisé", "لم تتم المزامنة بعد", "Aún sin sincronizar", "Ainda não sincronizado"],
    ["Show my debts summary inside CTone", "Erekana incamake y'imyenda yanjye muri CTone", "Onyesha muhtasari wa madeni yangu ndani ya CTone", "Afficher le résumé de mes dettes dans CTone", "عرض ملخص ديوني داخل CTone", "Mostrar el resumen de mis deudas en CTone", "Mostrar o resumo das minhas dívidas no CTone"],
    ["Add repayments I collect to CTone's ledger", "Ongera ubwishyu nakiriye mu bitabo bya CTone", "Ongeza malipo ninayokusanya kwenye leja ya CTone", "Ajouter les remboursements au registre CTone", "إضافة المبالغ التي أحصّلها إلى سجل CTone", "Añadir los cobros al libro de CTone", "Adicionar os recebimentos ao livro do CTone"],
    ["Open CTone ↗", "Fungura CTone ↗", "Fungua CTone ↗", "Ouvrir CTone ↗", "فتح CTone ↗", "Abrir CTone ↗", "Abrir CTone ↗"],
    ["Open CTone", "Fungura CTone", "Fungua CTone", "Ouvrir CTone", "فتح CTone", "Abrir CTone", "Abrir CTone"],
    ["CTone ↗", "CTone ↗", "CTone ↗", "CTone ↗", "CTone ↗", "CTone ↗", "CTone ↗"],
    ["⟳ Sync now", "⟳ Huza ubu", "⟳ Sawazisha sasa", "⟳ Synchroniser", "⟳ مزامنة الآن", "⟳ Sincronizar ahora", "⟳ Sincronizar agora"],
    ["Sync now", "Huza ubu", "Sawazisha sasa", "Synchroniser", "مزامنة الآن", "Sincronizar ahora", "Sincronizar agora"],
    ["Disconnect from CTone", "Tandukana na CTone", "Tenganisha na CTone", "Se déconnecter de CTone", "فصل الاتصال بـ CTone", "Desconectar de CTone", "Desconectar do CTone"],
    ["Disconnected", "Byatandukanye", "Imetenganishwa", "Déconnecté", "تم الفصل", "Desconectado", "Desconectado"],
    ["Connect", "Huza", "Unganisha", "Connecter", "ربط", "Conectar", "Conectar"],
    ["Connecting…", "Biri guhuzwa…", "Inaunganisha…", "Connexion…", "جارٍ الربط…", "Conectando…", "Conectando…"],
    ["Synced with CTone", "Byahujwe na CTone", "Imesawazishwa na CTone", "Synchronisé avec CTone", "تمت المزامنة مع CTone", "Sincronizado con CTone", "Sincronizado com o CTone"],
    ["Disconnect from CTone? Your Depta data stays. CTone will stop showing your debts.", "Gutandukana na CTone? Amakuru yawe ya Depta arasigara. CTone izareka kwerekana imyenda yawe.", "Tenganisha na CTone? Data yako ya Depta inabaki. CTone itaacha kuonyesha madeni yako.", "Se déconnecter de CTone ? Vos données Depta restent. CTone n'affichera plus vos dettes.", "فصل الاتصال بـ CTone؟ تبقى بيانات Depta. سيتوقف CTone عن عرض ديونك.", "¿Desconectar de CTone? Tus datos de Depta se conservan. CTone dejará de mostrar tus deudas.", "Desconectar do CTone? Seus dados do Depta ficam. O CTone deixa de mostrar suas dívidas."],
    ["Collection rules", "Amategeko yo kwishyuza", "Sheria za ukusanyaji", "Règles de recouvrement", "قواعد التحصيل", "Reglas de cobro", "Regras de cobrança"],
    ["Default days until due", "Iminsi isanzwe kugeza igihe cyo kwishyura", "Siku za kawaida hadi kulipa", "Jours par défaut avant échéance", "الأيام الافتراضية حتى الاستحقاق", "Días por defecto hasta el vencimiento", "Dias padrão até o vencimento"],
    ["Default interest % (once)", "Inyungu isanzwe % (rimwe)", "Riba ya kawaida % (mara moja)", "Intérêt par défaut % (une fois)", "الفائدة الافتراضية % (مرة)", "Interés por defecto % (una vez)", "Juros padrão % (uma vez)"],
    ["Grace days before late fee", "Iminsi y'imbabazi mbere y'ihazabu", "Siku za neema kabla ya faini", "Jours de grâce avant pénalité", "أيام السماح قبل الغرامة", "Días de gracia antes del recargo", "Dias de carência antes da multa"],
    ["Late fee cap (% of amount lent)", "Ikirenga cy'ihazabu (% by'amafaranga yatijwe)", "Kikomo cha faini (% ya kiasi kilichokopeshwa)", "Plafond de pénalité (% du montant)", "سقف الغرامة (% من المبلغ)", "Tope del recargo (% del monto)", "Teto da multa (% do valor)"],
    ["“Due soon” means within (days)", "“Hagiye kugera igihe” bivuga mu (minsi)", "“Inakaribia” inamaanisha ndani ya (siku)", "« Bientôt dû » = dans (jours)", "“يستحق قريبًا” تعني خلال (أيام)", "“Vence pronto” = dentro de (días)", "“Vence em breve” = em até (dias)"],
    ["Late fee is charged only on the part that is overdue, after the grace days, and never above the cap. Leave 0 for no late fee.", "Ihazabu yishyuzwa gusa ku gice cyarengeje igihe, nyuma y'iminsi y'imbabazi, kandi ntirirenga ikirenga. Shyiraho 0 niba nta hazabu.", "Faini hutozwa tu kwenye sehemu iliyochelewa, baada ya siku za neema, na haizidi kikomo. Weka 0 kama hakuna faini.", "La pénalité ne porte que sur la partie en retard, après les jours de grâce, sans dépasser le plafond. 0 = aucune.", "تُحتسب الغرامة فقط على الجزء المتأخر بعد أيام السماح ولا تتجاوز السقف. اترك 0 لعدم وجود غرامة.", "El recargo solo se cobra sobre lo vencido, tras los días de gracia, sin pasar el tope. 0 = sin recargo.", "A multa incide só sobre a parte atrasada, após a carência, sem passar o teto. 0 = sem multa."],
    ["Contact details", "Amakuru yo kuvugana", "Maelezo ya mawasiliano", "Coordonnées", "بيانات الاتصال", "Datos de contacto", "Dados de contato"],
    ["Country dial code (e.g. 256, 254, 255)", "Kode ya telefoni y'igihugu (urugero 250, 256, 255)", "Msimbo wa nchi wa simu (mf. 255, 254, 256)", "Indicatif du pays (ex. 250, 225, 33)", "رمز الاتصال الدولي (مثل 250، 254، 966)", "Prefijo del país (p. ej. 52, 34, 57)", "Código do país (ex. 258, 55, 351)"],
    ["Turns 0772… into +256772… so WhatsApp works.", "Ihindura 0772… kuba +256772… kugira ngo WhatsApp ikore.", "Hubadilisha 0772… kuwa +256772… ili WhatsApp ifanye kazi.", "Transforme 0772… en +256772… pour que WhatsApp fonctionne.", "يحوّل 0772… إلى +256772… ليعمل واتساب.", "Convierte 0772… en +256772… para que WhatsApp funcione.", "Transforma 0772… em +256772… para o WhatsApp funcionar."],
    ["Your shop phone (shown in messages)", "Telefoni y'iduka ryawe (igaragara mu butumwa)", "Simu ya duka lako (inaonekana kwenye ujumbe)", "Téléphone de la boutique (dans les messages)", "هاتف متجرك (يظهر في الرسائل)", "Teléfono de tu tienda (en los mensajes)", "Telefone da loja (nas mensagens)"],
    ["How customers should pay you", "Uko abakiriya bagomba kukwishyura", "Jinsi wateja wanavyopaswa kukulipa", "Comment les clients doivent payer", "كيف يدفع العملاء لك", "Cómo deben pagarte los clientes", "Como os clientes devem pagar"],
    ["Receipt footer", "Iherezo ry'inyemezabwishyu", "Maandishi ya chini ya risiti", "Pied du reçu", "تذييل الإيصال", "Pie del recibo", "Rodapé do recibo"],
    ["Reminder messages", "Ubutumwa bwo kwibutsa", "Jumbe za ukumbusho", "Messages de rappel", "رسائل التذكير", "Mensajes de recordatorio", "Mensagens de lembrete"],
    ["Use {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Clear a box to go back to the default.", "Koresha {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Siba agasanduku usubire ku busanzwe.", "Tumia {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Futa kisanduku kurudi kwenye chaguo-msingi.", "Utilisez {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Videz une case pour revenir au défaut.", "استخدم {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. امسح الحقل للعودة للافتراضي.", "Usa {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Vacía un cuadro para volver al valor por defecto.", "Use {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Limpe a caixa para voltar ao padrão."],
    ["Lock this device", "Hagarika iyi telefoni", "Funga kifaa hiki", "Verrouiller cet appareil", "قفل هذا الجهاز", "Bloquear este dispositivo", "Bloquear este dispositivo"],
    ["Ask for a PIN every time Depta is opened on this phone (protects your customers' data).", "Saba PIN buri gihe Depta ifunguwe kuri iyi telefoni (irinda amakuru y'abakiriya bawe).", "Omba PIN kila Depta inapofunguliwa kwenye simu hii (inalinda data ya wateja wako).", "Demander un code PIN à chaque ouverture de Depta (protège les données de vos clients).", "اطلب رمز PIN عند كل فتح لـ Depta على هذا الهاتف (يحمي بيانات عملائك).", "Pedir un PIN cada vez que se abra Depta en este teléfono (protege los datos de tus clientes).", "Pedir um PIN sempre que o Depta abrir neste telefone (protege os dados dos clientes)."],
    ["Choose a PIN (4–8 digits)", "Hitamo PIN (imibare 4–8)", "Chagua PIN (tarakimu 4–8)", "Choisissez un PIN (4–8 chiffres)", "اختر رمز PIN (4–8 أرقام)", "Elige un PIN (4–8 dígitos)", "Escolha um PIN (4–8 dígitos)"],
    ["Turn PIN lock on", "Shyiraho PIN", "Washa kufuli ya PIN", "Activer le verrou PIN", "تفعيل قفل PIN", "Activar bloqueo PIN", "Ativar bloqueio PIN"],
    ["Turn PIN lock off", "Kuraho PIN", "Zima kufuli ya PIN", "Désactiver le verrou PIN", "إيقاف قفل PIN", "Desactivar bloqueo PIN", "Desativar bloqueio PIN"],
    ["PIN lock is on", "PIN irashyizweho", "Kufuli ya PIN imewashwa", "Verrou PIN activé", "تم تفعيل قفل PIN", "Bloqueo PIN activado", "Bloqueio PIN ativado"],
    ["PIN lock off", "PIN yakuweho", "Kufuli ya PIN imezimwa", "Verrou PIN désactivé", "تم إيقاف قفل PIN", "Bloqueo PIN desactivado", "Bloqueio PIN desativado"],
    ["PIN lock needs a secure (https) connection.", "PIN ikeneye uruhare rwizewe (https).", "Kufuli ya PIN inahitaji muunganisho salama (https).", "Le verrou PIN exige une connexion sécurisée (https).", "يتطلب قفل PIN اتصالًا آمنًا (https).", "El bloqueo PIN requiere conexión segura (https).", "O bloqueio PIN exige conexão segura (https)."],
    ["Use at least 4 digits", "Koresha nibura imibare 4", "Tumia angalau tarakimu 4", "Utilisez au moins 4 chiffres", "استخدم 4 أرقام على الأقل", "Usa al menos 4 dígitos", "Use pelo menos 4 dígitos"],
    ["Wrong PIN", "PIN siyo", "PIN si sahihi", "PIN incorrect", "رمز PIN خاطئ", "PIN incorrecto", "PIN incorreto"],
    ["Depta is locked", "Depta irafunze", "Depta imefungwa", "Depta est verrouillé", "Depta مقفل", "Depta está bloqueado", "O Depta está bloqueado"],
    ["Unlock", "Fungura", "Fungua", "Déverrouiller", "فتح القفل", "Desbloquear", "Desbloquear"],
    ["Save settings", "Bika igenamiterere", "Hifadhi mipangilio", "Enregistrer les paramètres", "حفظ الإعدادات", "Guardar ajustes", "Salvar configurações"],
    ["Settings saved", "Igenamiterere ribitswe", "Mipangilio imehifadhiwa", "Paramètres enregistrés", "تم حفظ الإعدادات", "Ajustes guardados", "Configurações salvas"],
    ["Password changed", "Ijambo ry'ibanga ryahinduwe", "Nenosiri limebadilishwa", "Mot de passe modifié", "تم تغيير كلمة المرور", "Contraseña cambiada", "Senha alterada"],
    ["To install on iPhone: tap the Share button, then “Add to Home Screen”.", "Gushyira kuri iPhone: kanda Share, hanyuma “Add to Home Screen”.", "Kusakinisha kwenye iPhone: gusa Shiriki, kisha “Add to Home Screen”.", "Sur iPhone : touchez Partager puis « Sur l'écran d'accueil ».", "للتثبيت على آيفون: اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».", "En iPhone: pulsa Compartir y luego «Añadir a pantalla de inicio».", "No iPhone: toque em Compartilhar e depois «Adicionar à Tela de Início»."],
    // ---- server messages
    ["Please sign in again.", "Nyamuneka ongera winjire.", "Tafadhali ingia tena.", "Veuillez vous reconnecter.", "يرجى تسجيل الدخول مرة أخرى.", "Inicia sesión de nuevo.", "Entre novamente."],
    ["Wrong email or password.", "Imeri cyangwa ijambo ry'ibanga si byo.", "Barua pepe au nenosiri si sahihi.", "E-mail ou mot de passe incorrect.", "البريد أو كلمة المرور غير صحيحة.", "Correo o contraseña incorrectos.", "E-mail ou senha incorretos."],
    ["Wrong CTone email or password.", "Imeri cyangwa ijambo ry'ibanga bya CTone si byo.", "Barua pepe au nenosiri la CTone si sahihi.", "E-mail ou mot de passe CTone incorrect.", "بريد CTone أو كلمة المرور غير صحيحة.", "Correo o contraseña de CTone incorrectos.", "E-mail ou senha do CTone incorretos."],
    ["Too many attempts. Try again in 10 minutes.", "Wagerageje inshuro nyinshi. Ongera ugerageze nyuma y'iminota 10.", "Majaribio mengi sana. Jaribu tena baada ya dakika 10.", "Trop de tentatives. Réessayez dans 10 minutes.", "محاولات كثيرة. حاول بعد 10 دقائق.", "Demasiados intentos. Prueba en 10 minutos.", "Muitas tentativas. Tente em 10 minutos."],
    ["Enter your shop name.", "Andika izina ry'iduka ryawe.", "Weka jina la duka lako.", "Saisissez le nom de votre boutique.", "أدخل اسم متجرك.", "Escribe el nombre de tu tienda.", "Digite o nome da sua loja."],
    ["Enter your name.", "Andika izina ryawe.", "Weka jina lako.", "Saisissez votre nom.", "أدخل اسمك.", "Escribe tu nombre.", "Digite seu nome."],
    ["Enter a valid email.", "Andika imeri ikora.", "Weka barua pepe halali.", "Saisissez un e-mail valide.", "أدخل بريدًا صحيحًا.", "Escribe un correo válido.", "Digite um e-mail válido."],
    ["Password must be at least 6 characters.", "Ijambo ry'ibanga rigomba kuba rifite nibura inyuguti 6.", "Nenosiri liwe na angalau herufi 6.", "Le mot de passe doit avoir au moins 6 caractères.", "يجب أن تكون كلمة المرور 6 أحرف على الأقل.", "La contraseña debe tener al menos 6 caracteres.", "A senha deve ter pelo menos 6 caracteres."],
    ["That email is already registered. Sign in instead.", "Iyo imeri yamaze kwiyandikisha. Injira aho.", "Barua pepe hiyo imeshasajiliwa. Ingia badala yake.", "Cet e-mail est déjà inscrit. Connectez-vous.", "هذا البريد مسجّل بالفعل. سجّل الدخول.", "Ese correo ya está registrado. Inicia sesión.", "Esse e-mail já está cadastrado. Entre."],
    ["Enter the customer's name.", "Andika izina ry'umukiriya.", "Weka jina la mteja.", "Saisissez le nom du client.", "أدخل اسم العميل.", "Escribe el nombre del cliente.", "Digite o nome do cliente."],
    ["Pick a customer first.", "Banza uhitemo umukiriya.", "Chagua mteja kwanza.", "Choisissez d'abord un client.", "اختر عميلًا أولًا.", "Elige primero un cliente.", "Escolha um cliente primeiro."],
    ["Enter the amount owed.", "Andika amafaranga yishyuzwa.", "Weka kiasi kinachodaiwa.", "Saisissez le montant dû.", "أدخل المبلغ المستحق.", "Escribe el monto adeudado.", "Digite o valor devido."],
    ["Enter the amount received.", "Andika amafaranga yakiriwe.", "Weka kiasi kilichopokelewa.", "Saisissez le montant reçu.", "أدخل المبلغ المستلم.", "Escribe el monto recibido.", "Digite o valor recebido."],
    ["Enter the extra amount.", "Andika amafaranga y'inyongera.", "Weka kiasi cha ziada.", "Saisissez le montant supplémentaire.", "أدخل المبلغ الإضافي.", "Escribe el monto extra.", "Digite o valor extra."],
    ["Pick the new due date.", "Hitamo itariki nshya yo kwishyura.", "Chagua tarehe mpya ya kulipa.", "Choisissez la nouvelle échéance.", "اختر تاريخ الاستحقاق الجديد.", "Elige el nuevo vencimiento.", "Escolha o novo vencimento."],
    ["Pick the date the customer promised to pay.", "Hitamo itariki umukiriya yasezeranyije kwishyura.", "Chagua tarehe mteja aliyoahidi kulipa.", "Choisissez la date promise par le client.", "اختر التاريخ الذي وعد العميل بالدفع فيه.", "Elige la fecha prometida por el cliente.", "Escolha a data prometida pelo cliente."],
    ["That is more than the balance ({x}).", "Ibyo biruta asigaye ({x}).", "Hiyo ni zaidi ya salio ({x}).", "C'est plus que le solde ({x}).", "هذا أكثر من الرصيد ({x}).", "Eso es más que el saldo ({x}).", "Isso é mais que o saldo ({x})."],
    ["That is more than the total owed ({x}).", "Ibyo biruta yose yishyuzwa ({x}).", "Hiyo ni zaidi ya jumla inayodaiwa ({x}).", "C'est plus que le total dû ({x}).", "هذا أكثر من إجمالي المستحق ({x}).", "Eso es más que el total adeudado ({x}).", "Isso é mais que o total devido ({x})."],
    ["That transaction code was already used for another payment.", "Iyo kode y'igikorwa yamaze gukoreshwa ku bundi bwishyu.", "Msimbo huo wa muamala ushatumika kwa malipo mengine.", "Ce code de transaction a déjà été utilisé.", "رمز المعاملة هذا استُخدم لدفعة أخرى.", "Ese código de transacción ya se usó en otro pago.", "Esse código de transação já foi usado em outro pagamento."],
    ["That message says the payment failed.", "Ubwo butumwa buvuga ko ubwishyu bwanze.", "Ujumbe huo unasema malipo yameshindwa.", "Ce message indique que le paiement a échoué.", "تقول الرسالة إن الدفع فشل.", "Ese mensaje dice que el pago falló.", "Essa mensagem diz que o pagamento falhou."],
    ["This customer still owes money. Collect or write off the debt first.", "Uyu mukiriya aracyafite umwenda. Banza wishyuze cyangwa usibe umwenda.", "Mteja huyu bado anadaiwa. Kusanya au futa deni kwanza.", "Ce client doit encore de l'argent. Encaissez ou passez la dette en perte d'abord.", "هذا العميل ما زال مدينًا. حصّل الدين أو اشطبه أولًا.", "Este cliente aún debe dinero. Cobra o da de baja la deuda primero.", "Este cliente ainda deve. Receba ou baixe a dívida primeiro."],
    ["This customer owes nothing.", "Uyu mukiriya nta mwenda afite.", "Mteja huyu hadaiwi chochote.", "Ce client ne doit rien.", "هذا العميل لا يدين بشيء.", "Este cliente no debe nada.", "Este cliente não deve nada."],
    ["This debt already has payments. Void them first, or write it off.", "Uyu mwenda ufite ubwishyu bwamaze gukorwa. Babanze usubize inyuma, cyangwa uwusibe.", "Deni hili lina malipo. Yatendue kwanza, au lifute kama hasara.", "Cette dette a déjà des paiements. Annulez-les d'abord ou passez-la en perte.", "لهذا الدين مدفوعات. ألغِها أولًا أو اشطبه.", "Esta deuda ya tiene pagos. Anúlalos primero o dala de baja.", "Esta dívida já tem pagamentos. Anule-os primeiro ou baixe-a."],
    ["Server error. Please try again.", "Ikibazo cya seriveri. Ongera ugerageze.", "Hitilafu ya seva. Tafadhali jaribu tena.", "Erreur serveur. Réessayez.", "خطأ في الخادم. حاول مرة أخرى.", "Error del servidor. Inténtalo de nuevo.", "Erro no servidor. Tente novamente."]
  ];

  // default reminder messages in every built-in language (used until the owner edits them)
  const EN_TPL = {
    friendly: "Hello {name}, a friendly reminder from {shop}: your balance is {balance}, due {due}. {pay} Thank you 🙏",
    firm: "Dear {name}, your payment of {balance} to {shop} is overdue since {due} ({days} days). Please pay today. {pay}",
    final: "FINAL NOTICE – {name}, {balance} owed to {shop} is {days} days overdue. Please settle today or call {phone} to agree a plan. {pay}",
    thanks: "Thank you {name}! We received {paid}. Your balance with {shop} is now {balance}. 🙏"
  };
  const TPL = {
    rw: { friendly: "Muraho {name}, ni twe {shop} tukwibutsa: asigaye ni {balance}, agomba kwishyurwa {due}. {pay} Murakoze 🙏", firm: "Nshuti {name}, ubwishyu bwa {balance} kuri {shop} bwarengeje igihe kuva {due} (iminsi {days}). Nyamuneka wishyure uyu munsi. {pay}", final: "INTEGUZA YA NYUMA – {name}, {balance} yishyuzwa {shop} yarengeje iminsi {days}. Nyamuneka wishyure uyu munsi cyangwa uhamagare {phone} tuvugane. {pay}", thanks: "Murakoze {name}! Twakiriye {paid}. Asigaye kuri {shop} ni {balance}. 🙏" },
    sw: { friendly: "Habari {name}, ukumbusho kutoka {shop}: salio lako ni {balance}, linadaiwa {due}. {pay} Asante 🙏", firm: "Mpendwa {name}, malipo yako ya {balance} kwa {shop} yamechelewa tangu {due} (siku {days}). Tafadhali lipa leo. {pay}", final: "NOTISI YA MWISHO – {name}, {balance} unayodaiwa na {shop} imechelewa siku {days}. Tafadhali lipa leo au piga {phone} tukubaliane. {pay}", thanks: "Asante {name}! Tumepokea {paid}. Salio lako kwa {shop} sasa ni {balance}. 🙏" },
    fr: { friendly: "Bonjour {name}, petit rappel de {shop} : votre solde est de {balance}, dû le {due}. {pay} Merci 🙏", firm: "Cher/Chère {name}, votre paiement de {balance} à {shop} est en retard depuis le {due} ({days} jours). Merci de payer aujourd'hui. {pay}", final: "DERNIER AVIS – {name}, {balance} dus à {shop} sont en retard de {days} jours. Merci de régler aujourd'hui ou d'appeler le {phone}. {pay}", thanks: "Merci {name} ! Nous avons reçu {paid}. Votre solde chez {shop} est maintenant de {balance}. 🙏" },
    ar: { friendly: "مرحبًا {name}، تذكير ودّي من {shop}: رصيدك {balance} ويستحق في {due}. {pay} شكرًا 🙏", firm: "عزيزي {name}، دفعتك البالغة {balance} إلى {shop} متأخرة منذ {due} ({days} يومًا). يرجى الدفع اليوم. {pay}", final: "إشعار أخير – {name}، مبلغ {balance} المستحق لـ {shop} متأخر {days} يومًا. يرجى السداد اليوم أو الاتصال على {phone}. {pay}", thanks: "شكرًا {name}! استلمنا {paid}. رصيدك لدى {shop} الآن {balance}. 🙏" },
    es: { friendly: "Hola {name}, recordatorio amable de {shop}: tu saldo es {balance}, vence el {due}. {pay} Gracias 🙏", firm: "Estimado/a {name}, tu pago de {balance} a {shop} está vencido desde el {due} ({days} días). Por favor paga hoy. {pay}", final: "AVISO FINAL – {name}, {balance} adeudados a {shop} llevan {days} días de atraso. Paga hoy o llama al {phone}. {pay}", thanks: "¡Gracias {name}! Recibimos {paid}. Tu saldo con {shop} ahora es {balance}. 🙏" },
    pt: { friendly: "Olá {name}, lembrete amigável da {shop}: seu saldo é {balance}, vence em {due}. {pay} Obrigado 🙏", firm: "Prezado(a) {name}, seu pagamento de {balance} à {shop} está atrasado desde {due} ({days} dias). Pague hoje, por favor. {pay}", final: "AVISO FINAL – {name}, {balance} devidos à {shop} estão {days} dias atrasados. Pague hoje ou ligue para {phone}. {pay}", thanks: "Obrigado {name}! Recebemos {paid}. Seu saldo com a {shop} agora é {balance}. 🙏" }
  };

  // ------------------------------------------------------------ language state
  const saved = (() => { try { return localStorage.getItem('dp_lang'); } catch (e) { return null; } })();
  const auto = ((navigator.language || 'en').slice(0, 2)).toLowerCase();
  let pref = saved || (COLS.includes(auto) ? auto : 'en');
  const isG = pref.startsWith('g:');
  const lang = isG ? 'en' : (BUILTIN.some(b => b[0] === pref) ? pref : 'en');

  // ------------------------------------------------------------ engine
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plain = {}, nrows = [], xrows = []; let big = null;
  function compile() {
    const ci = COLS.indexOf(lang); if (ci < 0) return;
    ROWS.forEach(r => {
      const en = r[0], to = r[ci + 1]; if (!to) return;
      if (en.includes('{x}')) {
        const parts = en.split(/(\{[xy]\})/); let order = [], re = '^';
        parts.forEach(p => { if (p === '{x}' || p === '{y}') { order.push(p); re += '(.+?)'; } else re += esc(p); });
        xrows.push({ re: new RegExp(re + '$'), to, order });
      } else if (en.includes('{n}')) {
        const parts = en.split('{n}'); let re = '(?<![A-Za-z])';
        parts.forEach((p, i) => { re += esc(p) + (i < parts.length - 1 ? '(\\d[\\d,.]*)' : ''); });
        if (/[A-Za-z]$/.test(en)) re += '(?![A-Za-z])';
        nrows.push({ re: new RegExp(re, 'g'), to });
      } else plain[en] = to;
    });
    const keys = Object.keys(plain).sort((a, b) => b.length - a.length).map(esc);
    big = new RegExp('(?<![\\p{L}\\d])(?:' + keys.join('|') + ')(?![\\p{L}\\d])', 'gu');
  }
  function tr(s) {
    if (!big || !s || !/[A-Za-z]/.test(s)) return s;
    const t = s.trim();
    for (const x of xrows) { const m = t.match(x.re); if (m) { let o = x.to; x.order.forEach((k, i) => { o = o.split(k).join(m[i + 1]); }); return s.replace(t, o); } }
    let o = s;
    for (const n of nrows) { let i = 0; o = o.replace(n.re, (...a) => { let r = n.to, k = 0; return r.replace(/\{n\}/g, () => a[++k]); }); }
    return o.replace(big, m => plain[m] !== undefined ? plain[m] : m);
  }
  const RWM = ['Mut', 'Gas', 'Wer', 'Mat', 'Gic', 'Kam', 'Nya', 'Kan', 'Nze', 'Ukw', 'Ugu', 'Ukub'];
  const rwDate = (d, o) => { o = o || {}; let s = ''; if (o.day) s += d.getDate() + ' '; s += RWM[d.getMonth()]; if (o.year) s += ' ' + d.getFullYear(); if (o.time) s += ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); return s; };
  window.T = tr;
  window.I18N = { lang, pref, rwDate, loc: LOCALE[lang], tr, tpl: kind => (TPL[lang] || {})[kind] || null, enTpl: EN_TPL, dir: lang === 'ar' ? 'rtl' : 'ltr',
    name: () => isG ? (MORE.find(m => 'g:' + m[0] === pref) || ['', pref])[1] : (BUILTIN.find(b => b[0] === lang) || ['', 'English'])[1] };

  // ------------------------------------------------------------ DOM translation
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE']);
  const seen = new WeakMap();
  function txt(n) {
    const v = n.nodeValue; if (!v || !v.trim()) return;
    const o = seen.get(n); if (o !== undefined && o === v) return;
    const p = n.parentNode; if (p && (SKIP.has(p.nodeName) || (p.closest && p.closest('[data-notr]')))) return;
    const out = tr(v); if (out !== v) n.nodeValue = out; seen.set(n, out);
  }
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function attrs(el) { ATTRS.forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (v) { const o = tr(v); if (o !== v) el.setAttribute(a, o); } }); }
  function walk(root) {
    if (root.nodeType === 3) return txt(root);
    if (root.nodeType !== 1) return;
    attrs(root); if (SKIP.has(root.nodeName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) txt(n); else attrs(n); }
  }
  function start() {
    document.documentElement.lang = lang; document.documentElement.dir = window.I18N.dir;
    document.title = tr(document.title);
    document.querySelectorAll('[data-langname]').forEach(e => e.textContent = window.I18N.name());
    if (lang === 'en') return;
    walk(document.body);
    const mo = new MutationObserver(ms => {
      ms.forEach(m => {
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') txt(m.target);
        else if (m.type === 'attributes') attrs(m.target);
      });
      mo.takeRecords();
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  compile();
  const _c = window.confirm.bind(window), _p = window.prompt.bind(window), _a = window.alert.bind(window);
  window.confirm = s => _c(tr(s)); window.prompt = (s, d) => _p(tr(s), d); window.alert = s => _a(tr(s));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // ------------------------------------------------------------ Google auto-translate for every other language
  function gcookie(v) { const h = location.hostname, d = new Date(Date.now() + (v ? 3e10 : -1e3)).toUTCString(); ['', ';domain=' + h, ';domain=.' + h].forEach(x => { document.cookie = 'googtrans=' + (v || '') + ';expires=' + d + ';path=/' + x; }); }
  if (isG) {
    gcookie('/en/' + pref.slice(2));
    const st = document.createElement('style');
    st.textContent = '.goog-te-banner-frame,.goog-te-balloon-frame,#goog-gt-tt,.goog-tooltip,.skiptranslate>iframe{display:none!important}body{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}#google_translate_element{display:none}';
    document.head.appendChild(st);
    window.gtInit = () => new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
    const add = () => { const d = document.createElement('div'); d.id = 'google_translate_element'; document.body.appendChild(d); const s = document.createElement('script'); s.src = 'https://translate.google.com/translate_a/element.js?cb=gtInit'; document.head.appendChild(s); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  }

  // ------------------------------------------------------------ picker
  function setLang(code, g) {
    try { localStorage.setItem('dp_lang', g ? 'g:' + code : code); } catch (e) { }
    if (!g) gcookie(null);
    location.reload();
  }
  window.langPick = function () {
    if (document.getElementById('langov')) return;
    const o = document.createElement('div'); o.id = 'langov'; o.setAttribute('data-notr', '');
    o.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(10,26,63,.55);display:flex;align-items:flex-end;justify-content:center';
    const btn = (code, name, g, on) => `<button data-c="${code}" data-g="${g ? 1 : 0}" style="display:block;width:100%;text-align:start;padding:13px 14px;margin:0 0 6px;border-radius:12px;border:1.5px solid var(--line);background:${on ? 'var(--btnn)' : 'var(--card)'};color:${on ? '#fff' : 'var(--ink)'};font:inherit;font-weight:700;cursor:pointer">${name}${on ? ' ✓' : ''}</button>`;
    o.innerHTML = `<div style="background:var(--bg);color:var(--ink);width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px 24px"><div style="display:flex;align-items:center;margin-bottom:10px"><h2 style="flex:1;font-size:18px;margin:0">🌐 Language</h2><button id="lgx" style="border:0;background:var(--chip);color:var(--ink);border-radius:99px;padding:6px 12px;font-weight:700;cursor:pointer">Close</button></div>
      <p style="font-size:13px;color:var(--mut);margin:0 0 8px">Works offline</p>${BUILTIN.map(b => btn(b[0], b[1], false, !isG && b[0] === lang)).join('')}
      <p style="font-size:13px;color:var(--mut);margin:14px 0 8px">More languages (auto-translate, needs internet)</p>
      <input id="lgs" placeholder="Search language" autocomplete="off" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;margin-bottom:8px">
      <div id="lgl">${MORE.map(m => btn(m[0], m[1], true, isG && pref === 'g:' + m[0])).join('')}</div></div>`;
    document.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target === o || e.target.id === 'lgx') return o.remove(); const b = e.target.closest('button[data-c]'); if (b) setLang(b.dataset.c, b.dataset.g === '1'); });
    o.querySelector('#lgs').oninput = e => { const q = e.target.value.toLowerCase(); o.querySelectorAll('#lgl button').forEach(b => { b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none'; }); };
    if (lang !== 'en') { o.querySelector('h2').textContent = '🌐 ' + tr('Language'); o.querySelector('#lgx').textContent = tr('Close'); }
  };
})();
