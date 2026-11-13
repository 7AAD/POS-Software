"""Serve only built files under the same path prefix as GitHub Pages."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

BUILD = Path(__file__).resolve().parents[2] / "dist"
PREFIX = "/POS-Software/"


class PagesHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not urlsplit(self.path).path.startswith(PREFIX):
            self.send_error(404)
            return
        self.path = "/" + self.path[len(PREFIX):]
        super().do_GET()


server = ThreadingHTTPServer(
    ("127.0.0.1", 4175), partial(PagesHandler, directory=str(BUILD))
)
server.serve_forever()
