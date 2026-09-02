/**
 * Gizlilik politikası ve kullanım şartları — brief §4.10.
 * Form üzerinden kişisel veri toplandığı için GDPR/KVKK notu zorunlu.
 *
 * NOT: Resmî şirket unvanı, adres ve vergi numarası henüz gelmedi (brief §16).
 * Bu metinlerde `{company}` yer tutucusu Setting'ten dolar; boşsa marka adı
 * kullanılır. Yayına çıkmadan önce hukuki metinlerin bir hukukçu tarafından
 * gözden geçirilmesi önerilir.
 */

import type { Locale } from "@/i18n/routing";

export type LegalDoc = {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const UPDATED = "2026-08-31";

export const PRIVACY: Record<Locale, LegalDoc> = {
  en: {
    title: "Privacy policy",
    updated: UPDATED,
    sections: [
      {
        heading: "Who we are",
        body: [
          "THE CHAMP GLOBAL is a knitwear manufacturer based in Istanbul, Türkiye. This policy explains what personal data we collect through this website, why we collect it and what rights you have.",
          "For any question about this policy or your data, write to {email}.",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "When you send an inquiry we collect the data you enter in the form: name, company, country, email address, phone number, the products you are interested in, estimated quantity and your message.",
          "We also store the list of styles you added to your inquiry list so that we can quote them.",
          "We do not use advertising cookies or third-party trackers. Your language, theme and currency preferences are stored in your browser and in a functional cookie so the site remembers your choice.",
        ],
      },
      {
        heading: "Why we use it",
        body: [
          "We process this data solely to respond to your inquiry, prepare a quotation and manage the resulting business relationship. The legal basis is your consent and our legitimate interest in answering a commercial request.",
          "We do not sell your data and we do not use it for marketing without your separate permission.",
        ],
      },
      {
        heading: "Who processes it",
        body: [
          "Data is stored on our database provider's servers and email is delivered through our email service provider. These providers act as processors on our behalf and are bound by their own data protection commitments.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Inquiry records are kept for as long as needed to serve the business relationship, and at most three years after the last contact, unless a longer period is required by law.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You may ask us to access, correct, delete or export your data, or object to its processing. Write to {email} and we will respond within 30 days.",
          "If you are in the EEA or UK you may also lodge a complaint with your local data protection authority. In Türkiye, KVKK applies.",
        ],
      },
    ],
  },
  tr: {
    title: "Gizlilik politikası",
    updated: UPDATED,
    sections: [
      {
        heading: "Biz kimiz",
        body: [
          "THE CHAMP GLOBAL, İstanbul merkezli bir örme tekstil üreticisidir. Bu politika, bu web sitesi üzerinden hangi kişisel verileri topladığımızı, neden topladığımızı ve haklarınızın neler olduğunu açıklar.",
          "Bu politika veya verileriniz hakkında her türlü soru için {email} adresine yazabilirsiniz.",
        ],
      },
      {
        heading: "Neleri topluyoruz",
        body: [
          "Teklif talebi gönderdiğinizde formda girdiğiniz verileri topluyoruz: ad soyad, firma, ülke, e-posta adresi, telefon, ilgilendiğiniz ürünler, tahmini adet ve mesajınız.",
          "Teklif listenize eklediğiniz modelleri de, fiyatlandırabilmek için saklıyoruz.",
          "Reklam çerezi veya üçüncü taraf izleyici kullanmıyoruz. Dil, tema ve para birimi tercihiniz tarayıcınızda ve işlevsel bir çerezde saklanır; böylece seçiminizi hatırlarız.",
        ],
      },
      {
        heading: "Neden kullanıyoruz",
        body: [
          "Bu veriyi yalnızca talebinize yanıt vermek, teklif hazırlamak ve doğacak ticari ilişkiyi yürütmek için işliyoruz. Hukuki dayanak, açık rızanız ve ticari bir talebi yanıtlamaktaki meşru menfaatimizdir.",
          "Verinizi satmıyoruz ve ayrı izniniz olmadan pazarlama amacıyla kullanmıyoruz.",
        ],
      },
      {
        heading: "Kimler işliyor",
        body: [
          "Veri, veritabanı sağlayıcımızın sunucularında saklanır; e-posta gönderimi e-posta servis sağlayıcımız üzerinden yapılır. Bu sağlayıcılar bizim adımıza veri işleyen sıfatıyla hareket eder ve kendi veri koruma taahhütleriyle bağlıdır.",
        ],
      },
      {
        heading: "Ne kadar saklıyoruz",
        body: [
          "Teklif kayıtları ticari ilişkinin gerektirdiği süre boyunca ve son temastan itibaren en fazla üç yıl saklanır; mevzuat daha uzun bir süre gerektirmiyorsa.",
        ],
      },
      {
        heading: "Haklarınız",
        body: [
          "Verilerinize erişme, düzeltme, silme, taşıma ve işlenmesine itiraz etme haklarınız vardır. {email} adresine yazın, 30 gün içinde dönüş yapalım.",
          "Türkiye'de KVKK; AEA veya Birleşik Krallık'taysanız GDPR kapsamında yerel veri koruma otoritenize şikâyette bulunabilirsiniz.",
        ],
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    updated: UPDATED,
    sections: [
      {
        heading: "Wer wir sind",
        body: [
          "THE CHAMP GLOBAL ist ein Strickwarenhersteller mit Sitz in Istanbul, Türkiye. Diese Erklärung beschreibt, welche personenbezogenen Daten wir über diese Website erheben, warum wir das tun und welche Rechte Sie haben.",
          "Bei Fragen zu dieser Erklärung oder Ihren Daten schreiben Sie an {email}.",
        ],
      },
      {
        heading: "Was wir erheben",
        body: [
          "Wenn Sie eine Anfrage senden, erheben wir die von Ihnen eingegebenen Daten: Name, Firma, Land, E-Mail-Adresse, Telefonnummer, die Sie interessierenden Produkte, die geschätzte Menge und Ihre Nachricht.",
          "Außerdem speichern wir die Modelle, die Sie Ihrer Anfrageliste hinzugefügt haben, um sie kalkulieren zu können.",
          "Wir verwenden keine Werbe-Cookies und keine Tracker Dritter. Sprache, Design und Währung werden in Ihrem Browser und in einem funktionalen Cookie gespeichert, damit die Website Ihre Wahl behält.",
        ],
      },
      {
        heading: "Warum wir sie nutzen",
        body: [
          "Wir verarbeiten diese Daten ausschließlich, um Ihre Anfrage zu beantworten, ein Angebot zu erstellen und die daraus entstehende Geschäftsbeziehung zu führen. Rechtsgrundlage sind Ihre Einwilligung und unser berechtigtes Interesse an der Beantwortung einer geschäftlichen Anfrage.",
          "Wir verkaufen Ihre Daten nicht und nutzen sie ohne gesonderte Erlaubnis nicht für Marketing.",
        ],
      },
      {
        heading: "Wer sie verarbeitet",
        body: [
          "Die Daten liegen auf den Servern unseres Datenbankanbieters; E-Mails werden über unseren E-Mail-Dienstleister zugestellt. Diese Anbieter handeln als Auftragsverarbeiter und sind an eigene Datenschutzverpflichtungen gebunden.",
        ],
      },
      {
        heading: "Wie lange wir sie speichern",
        body: [
          "Anfragedaten werden so lange gespeichert, wie es die Geschäftsbeziehung erfordert, höchstens jedoch drei Jahre nach dem letzten Kontakt, sofern keine längere gesetzliche Frist gilt.",
        ],
      },
      {
        heading: "Ihre Rechte",
        body: [
          "Sie können Auskunft, Berichtigung, Löschung oder Übertragung Ihrer Daten verlangen oder der Verarbeitung widersprechen. Schreiben Sie an {email}; wir antworten innerhalb von 30 Tagen.",
          "Im EWR oder im Vereinigten Königreich können Sie sich zudem bei Ihrer Datenschutzaufsichtsbehörde beschweren. In der Türkei gilt das KVKK.",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: UPDATED,
    sections: [
      {
        heading: "من نحن",
        body: [
          "THE CHAMP GLOBAL مصنّع تريكو مقره إسطنبول، تركيا. توضح هذه السياسة ما نجمعه من بيانات شخصية عبر هذا الموقع، ولماذا نجمعها، وما هي حقوقك.",
          "لأي سؤال حول هذه السياسة أو بياناتك، راسلنا على {email}.",
        ],
      },
      {
        heading: "ما الذي نجمعه",
        body: [
          "عند إرسال طلب عرض سعر نجمع البيانات التي تدخلها في النموذج: الاسم، الشركة، الدولة، البريد الإلكتروني، الهاتف، المنتجات التي تهمك، الكمية التقديرية ورسالتك.",
          "كما نحتفظ بقائمة الموديلات التي أضفتها إلى قائمة طلب العرض حتى نتمكن من تسعيرها.",
          "لا نستخدم ملفات تعريف ارتباط إعلانية ولا أدوات تتبع من أطراف ثالثة. تُحفظ تفضيلات اللغة والمظهر والعملة في متصفحك وفي ملف تعريف ارتباط وظيفي ليتذكر الموقع اختيارك.",
        ],
      },
      {
        heading: "لماذا نستخدمها",
        body: [
          "نعالج هذه البيانات فقط للرد على طلبك وإعداد عرض سعر وإدارة العلاقة التجارية الناتجة. الأساس القانوني هو موافقتك ومصلحتنا المشروعة في الرد على طلب تجاري.",
          "لا نبيع بياناتك ولا نستخدمها لأغراض تسويقية دون إذن منفصل منك.",
        ],
      },
      {
        heading: "من يعالجها",
        body: [
          "تُخزَّن البيانات على خوادم مزوّد قاعدة البيانات لدينا، ويُرسل البريد عبر مزوّد خدمة البريد الإلكتروني. يعمل هؤلاء المزوّدون كمعالجين نيابة عنا وهم ملتزمون بتعهدات حماية البيانات الخاصة بهم.",
        ],
      },
      {
        heading: "مدة الاحتفاظ",
        body: [
          "نحتفظ بسجلات الطلبات طوال المدة اللازمة للعلاقة التجارية، وبحد أقصى ثلاث سنوات من آخر تواصل، ما لم يقتضِ القانون مدة أطول.",
        ],
      },
      {
        heading: "حقوقك",
        body: [
          "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو نقلها، أو الاعتراض على معالجتها. راسلنا على {email} وسنرد خلال 30 يوماً.",
          "إذا كنت في المنطقة الاقتصادية الأوروبية أو المملكة المتحدة يمكنك أيضاً تقديم شكوى إلى هيئة حماية البيانات المحلية. وفي تركيا يُطبَّق قانون KVKK.",
        ],
      },
    ],
  },
};

export const TERMS: Record<Locale, LegalDoc> = {
  en: {
    title: "Terms of use",
    updated: UPDATED,
    sections: [
      {
        heading: "Scope",
        body: [
          "This website presents the product range and manufacturing capabilities of THE CHAMP GLOBAL to business customers. It is an information and inquiry tool; it is not an online shop and no order can be placed through it.",
        ],
      },
      {
        heading: "Products and prices",
        body: [
          "Product images, colours, fabrics and weights are indicative. Minor variations between the displayed image and the produced garment are normal in textile manufacturing.",
          "Where prices are shown, they are unit prices per quantity tier, quoted EXW Istanbul, excluding VAT and shipping. Prices are indicative and not a binding offer; they may vary depending on order quantity, product specifications, customization and delivery terms. A binding price is given only in a written quotation.",
        ],
      },
      {
        heading: "Inquiries",
        body: [
          "Sending an inquiry does not create a contract. A contract arises only when we confirm an order in writing.",
          "Minimum order quantities, lead times and payment terms are confirmed in the quotation.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "All content on this site — texts, product images, designs and the brand name — belongs to THE CHAMP GLOBAL and may not be reproduced without written permission.",
          "Designs and artwork you send us for private label production remain yours. We use them only to produce your order.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "We take care to keep the information on this site accurate and up to date but do not warrant that it is free of errors. We are not liable for indirect damages arising from the use of this website.",
        ],
      },
      {
        heading: "Applicable law",
        body: ["These terms are governed by Turkish law. The courts of Istanbul have jurisdiction."],
      },
    ],
  },
  tr: {
    title: "Kullanım şartları",
    updated: UPDATED,
    sections: [
      {
        heading: "Kapsam",
        body: [
          "Bu web sitesi, THE CHAMP GLOBAL'in ürün yelpazesini ve üretim kabiliyetlerini kurumsal müşterilere sunar. Bir bilgi ve teklif talebi aracıdır; çevrimiçi mağaza değildir ve üzerinden sipariş verilemez.",
        ],
      },
      {
        heading: "Ürünler ve fiyatlar",
        body: [
          "Ürün görselleri, renkler, kumaşlar ve gramajlar bilgilendirme amaçlıdır. Gösterilen görsel ile üretilen ürün arasındaki küçük farklar tekstil üretiminde olağandır.",
          "Fiyat gösterildiği yerlerde, adet kademesine göre birim fiyattır; EXW İstanbul olup KDV ve nakliye hariçtir. Fiyatlar bilgilendirme amaçlıdır ve bağlayıcı bir teklif değildir; sipariş adedine, ürün özelliklerine, özelleştirmeye ve teslim şartlarına göre değişebilir. Bağlayıcı fiyat yalnızca yazılı teklifle verilir.",
        ],
      },
      {
        heading: "Teklif talepleri",
        body: [
          "Teklif talebi göndermek sözleşme kurmaz. Sözleşme, ancak siparişi yazılı olarak onayladığımızda doğar.",
          "Minimum sipariş adetleri, terminler ve ödeme koşulları teklifte netleşir.",
        ],
      },
      {
        heading: "Fikri mülkiyet",
        body: [
          "Bu sitedeki tüm içerik — metinler, ürün görselleri, tasarımlar ve marka adı — THE CHAMP GLOBAL'e aittir ve yazılı izin olmadan çoğaltılamaz.",
          "Private label üretim için bize gönderdiğiniz tasarım ve görseller size aittir. Bunları yalnızca siparişinizi üretmek için kullanırız.",
        ],
      },
      {
        heading: "Sorumluluk",
        body: [
          "Bu sitedeki bilgilerin doğru ve güncel olması için özen gösteririz ancak hatasız olduğunu garanti etmeyiz. Web sitesinin kullanımından doğan dolaylı zararlardan sorumlu değiliz.",
        ],
      },
      {
        heading: "Uygulanacak hukuk",
        body: ["Bu şartlar Türk hukukuna tabidir. İstanbul mahkemeleri yetkilidir."],
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    updated: UPDATED,
    sections: [
      {
        heading: "Geltungsbereich",
        body: [
          "Diese Website stellt Geschäftskunden das Produktsortiment und die Fertigungskapazitäten von THE CHAMP GLOBAL vor. Sie ist ein Informations- und Anfragewerkzeug; sie ist kein Onlineshop, und es können darüber keine Bestellungen aufgegeben werden.",
        ],
      },
      {
        heading: "Produkte und Preise",
        body: [
          "Produktbilder, Farben, Stoffe und Gewichte sind Richtwerte. Geringfügige Abweichungen zwischen abgebildetem und gefertigtem Kleidungsstück sind in der Textilproduktion üblich.",
          "Wo Preise angezeigt werden, handelt es sich um Stückpreise je Mengenstaffel, EXW Istanbul, zzgl. MwSt. und Versand. Die Preise sind unverbindlich und stellen kein bindendes Angebot dar; sie können je nach Bestellmenge, Produktspezifikation, Anpassung und Lieferbedingungen abweichen. Ein verbindlicher Preis wird nur in einem schriftlichen Angebot genannt.",
        ],
      },
      {
        heading: "Anfragen",
        body: [
          "Das Senden einer Anfrage begründet keinen Vertrag. Ein Vertrag kommt erst zustande, wenn wir einen Auftrag schriftlich bestätigen.",
          "Mindestbestellmengen, Lieferzeiten und Zahlungsbedingungen werden im Angebot bestätigt.",
        ],
      },
      {
        heading: "Geistiges Eigentum",
        body: [
          "Alle Inhalte dieser Website — Texte, Produktbilder, Designs und der Markenname — gehören THE CHAMP GLOBAL und dürfen ohne schriftliche Genehmigung nicht vervielfältigt werden.",
          "Designs und Grafiken, die Sie uns für die Private-Label-Produktion senden, bleiben Ihr Eigentum. Wir verwenden sie ausschließlich zur Fertigung Ihres Auftrags.",
        ],
      },
      {
        heading: "Haftung",
        body: [
          "Wir bemühen uns, die Informationen auf dieser Website korrekt und aktuell zu halten, gewährleisten jedoch keine Fehlerfreiheit. Für mittelbare Schäden aus der Nutzung dieser Website haften wir nicht.",
        ],
      },
      {
        heading: "Anwendbares Recht",
        body: ["Es gilt türkisches Recht. Gerichtsstand ist Istanbul."],
      },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    updated: UPDATED,
    sections: [
      {
        heading: "النطاق",
        body: [
          "يعرض هذا الموقع تشكيلة منتجات THE CHAMP GLOBAL وإمكانياتها التصنيعية على العملاء من الشركات. وهو أداة معلومات وطلب عروض؛ وليس متجراً إلكترونياً ولا يمكن تقديم طلبات شراء من خلاله.",
        ],
      },
      {
        heading: "المنتجات والأسعار",
        body: [
          "صور المنتجات والألوان والأقمشة والأوزان إرشادية. الاختلافات الطفيفة بين الصورة المعروضة والقطعة المنتجة أمر معتاد في صناعة النسيج.",
          "حيثما تظهر الأسعار فهي أسعار الوحدة حسب شريحة الكمية، تسليم أرض المصنع إسطنبول، غير شاملة الضريبة والشحن. الأسعار إرشادية وليست عرضاً ملزماً؛ وقد تختلف حسب كمية الطلب ومواصفات المنتج والتخصيص وشروط التسليم. ولا يُعطى سعر ملزم إلا في عرض سعر مكتوب.",
        ],
      },
      {
        heading: "طلبات العروض",
        body: [
          "إرسال طلب عرض لا ينشئ عقداً. ينشأ العقد فقط عند تأكيدنا الطلب كتابياً.",
          "تُؤكَّد الحدود الدنيا للطلب ومدد التسليم وشروط الدفع في عرض السعر.",
        ],
      },
      {
        heading: "الملكية الفكرية",
        body: [
          "جميع محتويات هذا الموقع — النصوص وصور المنتجات والتصاميم واسم العلامة — ملك لـ THE CHAMP GLOBAL ولا يجوز نسخها دون إذن كتابي.",
          "تبقى التصاميم والأعمال الفنية التي ترسلها إلينا للإنتاج بالعلامة الخاصة ملكاً لك، ونستخدمها فقط لتنفيذ طلبك.",
        ],
      },
      {
        heading: "المسؤولية",
        body: [
          "نحرص على أن تكون المعلومات في هذا الموقع دقيقة ومحدّثة، لكننا لا نضمن خلوها من الأخطاء. ولا نتحمل المسؤولية عن الأضرار غير المباشرة الناشئة عن استخدام هذا الموقع.",
        ],
      },
      {
        heading: "القانون الواجب التطبيق",
        body: ["تخضع هذه الشروط للقانون التركي، والاختصاص القضائي لمحاكم إسطنبول."],
      },
    ],
  },
};
