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
        expect(page.locator("tbody")).to_contain_text("Regressão")
        page.locator("#import").set_input_files(root / "exemplo.json")
        page.get_by_text("Adicionar regra à comparação",exact=True).click()
        page.locator("#ruleName").fill("Equipe de apoio")
        page.locator("#channel").fill("tickets")
        page.locator("#member").fill("exemplo")
        page.locator("#roles").fill("visitante")
        page.locator("#expect").select_option("true")
        page.get_by_text("Incluir e comparar",exact=True).click()
        expect(page.locator("tbody tr")).to_have_count(2)
        page.locator("#filter").select_option("Regressão")
        expect(page.locator("tbody tr")).to_have_count(1)
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
        assert not errors, errors
        page.close()
    browser.close()
server.shutdown()
server.server_close()
