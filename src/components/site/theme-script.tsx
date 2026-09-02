/**
 * Tema, ilk boyamadan önce <html data-theme> üzerine yazılır — flash olmasın.
 * Kural (brief §3.1): localStorage tercihi varsa o, yoksa sistem tercihi okunur
 * ama VARSAYILAN DARK'tır (kullanıcı tercihi yoksa dark).
 */
const script = `(function(){try{
var s=localStorage.getItem('theme');
var t=(s==='light'||s==='dark')?s:'dark';
document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function ThemeScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
import Script from "next/script";
