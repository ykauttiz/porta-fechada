"""Exercise the public workflow with synthetic data."""
import os
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p, TemporaryDirectory() as tmp:
    backend = os.environ.get("ENGINE", "chromium")
    browser = getattr(p, backend).launch(executable_path=shutil.which("google-chrome") if backend == "chromium" else None)
    for width in (375, 1280):
        page = browser.new_page(viewport={"width": width, "height": 850}, accept_downloads=True)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        page.keyboard.press("Tab")
        expect(page.locator(".skip")).to_be_focused()
        page.keyboard.press("Enter")
        assert page.evaluate("location.hash === document.querySelector('.skip').hash")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        expect(page.locator("#rule-table tbody")).to_contain_text("Regressão")
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
        assert not errors, errors
        page.close()
    browser.close()
server.shutdown()
server.server_close()
