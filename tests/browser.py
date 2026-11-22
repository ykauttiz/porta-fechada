"""Exercise the public workflow with synthetic data."""
import os
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright

# Texto sem o contraste mínimo do WCAG AA (4,5:1; 3:1 para texto grande), medido nos estilos calculados.
CONTRAST_SCAN = r"""() => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return {r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3]}; };
  const over = (f, b) => ({r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1});
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const background = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none") return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) layers.push(c);
      if (c && c.a >= 1) break;
    }
    let acc = {r: 255, g: 255, b: 255, a: 1};
    const page = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (page && page.a > 0) acc = over(page, acc);
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  };
  const low = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (s.display === "none" || s.visibility === "hidden" || el.closest("[hidden]") || el.tagName === "OPTION") continue;
    if (box.width < 1 || box.height < 1 || box.right <= 0 || box.bottom <= 0) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const bg = background(el), fg = parse(s.color);
    if (!bg || !fg) continue;
    const size = parseFloat(s.fontSize), large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight) >= 700);
    const value = ratio(over(fg, bg), bg);
    if (value < (large ? 3 : 4.5)) low.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${el.textContent.trim().slice(0, 24)}" ${value.toFixed(2)}`);
  }
  return low;
}"""

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p, TemporaryDirectory() as tmp:
    backend = os.environ.get("ENGINE", "chromium")
    browser = getattr(p, backend).launch(executable_path=shutil.which("google-chrome") if backend == "chromium" else None)
    for width in (320, 375, 1280):
        page = browser.new_page(viewport={"width": width, "height": 850}, accept_downloads=True)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        theme = page.get_by_role("combobox", name="Tema da interface")
        for mode in ("dark", "light"):
            theme.select_option(mode)
            expect(page.locator("html")).to_have_attribute("data-theme", mode)
            assert page.evaluate("getComputedStyle(document.documentElement).colorScheme") == mode
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.reload()
        expect(theme).to_have_value("light")
        theme.select_option("system")
        page.emulate_media(color_scheme="dark")
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")
        page.emulate_media(color_scheme="light")
        expect(page.locator("html")).to_have_attribute("data-theme", "light")
        page.reload()
        page.keyboard.press("Tab")
        expect(page.locator(".skip")).to_be_focused()
        page.keyboard.press("Enter")
        assert page.evaluate("location.hash === document.querySelector('.skip').hash")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        expect(page.locator("#rule-table tbody")).to_contain_text("Regressão")
        for mode in ("dark", "light"):
            theme.select_option(mode)
            page.evaluate("document.querySelectorAll('details:not([open])').forEach(d => { d.open = true; d.dataset.scan = '1' })")
            page.evaluate("document.querySelector('.skip').focus()")
            page.wait_for_timeout(300)
            low = page.evaluate(CONTRAST_SCAN)
            assert not low, (mode, width, low)
            page.evaluate("document.activeElement.blur(); document.querySelectorAll('details[data-scan]').forEach(d => { d.open = false; delete d.dataset.scan })")
        theme.select_option("system")
        detail = page.locator("#rule-table tbody details").last
        detail.locator("summary").click()
        expect(detail.locator("li")).to_have_count(3)
        expect(detail.locator("li").last).to_have_text("Canal · cargos do membro · Permitido")
        detail.locator("summary").click()
        if os.environ.get("CAPTURAR_DEMO") == "1":
            captures = root / "capturas"
            captures.mkdir(exist_ok=True)
            page.screenshot(path=captures / f"demo-{width}.png", animations="disabled")

        page.get_by_text("Histórico local de comparações",exact=True).click()
        page.locator("#history-name").fill("Teste de revisão")
        page.locator("#history-save").click()
        expect(page.locator("#history-list option")).to_have_count(1)
        page.locator("#history-open").click()
        page.get_by_text("Matriz por membro e canal",exact=True).click()
        expect(page.locator("#matrix-rows")).to_contain_text("Negado → Permitido")
        expect(page.locator("#matrix-rows")).to_contain_text("Sem regra")
        page.get_by_text("Matriz por membro e canal",exact=True).click()
        page.locator("#import").set_input_files(root / "exemplo.json")
        page.get_by_text("Adicionar regra à comparação",exact=True).click()
        page.locator("#ruleName").fill("Equipe de apoio")
        page.locator("#channel").fill("tickets")
        page.locator("#member").fill("exemplo")
        page.locator("#roles").fill("visitante")
        page.locator("#expect").select_option("true")
        page.get_by_text("Incluir e comparar",exact=True).click()
        expect(page.locator("#rule-table tbody tr")).to_have_count(2)
        page.locator("#rule-search").fill("equipe")
        expect(page.locator("#rule-table tbody tr")).to_have_count(1)
        page.locator("#rule-search").fill("visitante")
        expect(page.locator("#rule-table tbody tr")).to_have_count(2)
        page.locator("#rule-search").fill("nada cadastrado")
        expect(page.locator("#message")).to_contain_text("Nenhuma regra")
        page.locator("#rule-search").fill("")
        page.locator("#import").set_input_files({"name":"invalido.json","mimeType":"application/json","buffer":b"{"})
        expect(page.locator("#message")).to_contain_text("Arquivo não importado")
        expect(page.locator("#rule-table tbody tr")).to_have_count(2)
        page.locator("#filter").select_option("Regressão")
        expect(page.locator("#rule-table tbody tr")).to_have_count(1)
        with page.expect_download() as downloaded:
            page.locator("#download").click()
        import json
        assert len(json.loads(downloaded.value.path().read_text())["rules"]) == 2
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        with page.expect_download() as csv:
            page.locator("#csv").click()
        import csv as csv_module
        with csv.value.path().open(encoding="utf-8-sig") as stream:
            evidence=list(csv_module.DictReader(stream, delimiter=";"))
        assert len(evidence)==2 and len(evidence[0]["SHA-256 da configuração"])==64
        data = json.loads((root/"exemplo.json").read_text())
        data["rules"] = [dict(data["rules"][0],name=f"Regra {i:04d}") for i in range(2000)]
        page.locator("#import").set_input_files({"name":"lote.json","mimeType":"application/json","buffer":json.dumps(data).encode()})
        expect(page.locator("#rule-page")).to_have_text("1 / 40")
        expect(page.locator("#rule-table tbody tr")).to_have_count(50)
        page.locator("#rule-next").click()
        expect(page.locator("#rule-table tbody tr").first).to_contain_text("Regra 0050")
        page.locator("#rule-search").fill("Regra 1999")
        expect(page.locator("#rule-table tbody tr")).to_have_count(1)
        expect(page.locator("#rule-pages")).to_be_hidden()
        page.get_by_role("button",name="Passou · 0").click()
        expect(page.locator("#rule-table tbody tr")).to_have_count(0)
        page.locator("#rule-search").fill("")
        page.locator("#filter").select_option("")
        page.locator("#import").set_input_files(root / "exemplo-thread.json")
        expect(page.locator("#rule-table tbody")).to_contain_text("Corrigida")
        expect(page.locator("#rule-table tbody")).to_contain_text("convite")
        assert not errors, errors
        page.close()
    browser.close()
server.shutdown()
server.server_close()
