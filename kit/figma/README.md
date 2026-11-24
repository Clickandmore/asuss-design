# التصميم على Figma — الاتجاه «أ: هادئ مؤسسي» · خط Cairo

ملف Figma: https://www.figma.com/design/bKK4FnJXNAXGl21epfSG0C (ثلاث شاشات: قائمة العقود، تفاصيل عقد، عقد استقدام جديد).

| الملف | الدور |
|---|---|
| `build_direction_a.py` | يكتب `direction-a.html`: الشاشات الثلاث كصفحة ثابتة (أيقونات SVG والشعار مضمّنة، لأن Figma لا يجلب ملفات خارجية) |
| `freeze.js` | يرسم الصفحة RTL في المتصفح ثم يثبّت كل عنصر في مكانه (`direction-a.frozen.html`)، لأن محوّل Figma يقلب ترتيب العناصر العربية |
| `direction-a.frozen.html` | ما يُرسل إلى Figma (`html_to_figma` مع `cssSelector: .screen`) |

```bash
python3 kit/figma/build_direction_a.py
node kit/figma/freeze.js http://127.0.0.1:8791/kit/figma/direction-a.html kit/figma/direction-a.frozen.html   # يحتاج playwright-core
```

نص يجمع عربيًا ورقمًا أو لاتينيًا في سطر واحد: يبدأ بـ U+200F (علامة اتجاه من اليمين) حتى لا يعكس Figma ترتيبه.
