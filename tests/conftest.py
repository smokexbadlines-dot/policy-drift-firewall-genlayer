import os

import pytest

@pytest.fixture
def win_deploy(direct_deploy, monkeypatch):
    """Work around gltest 0.29.2 unlinking an open fd-0 file on Windows."""
    original_unlink = os.unlink
    pending = []

    def defer_open_file(path, *args, **kwargs):
        try:
            return original_unlink(path, *args, **kwargs)
        except PermissionError:
            pending.append(path)

    def deploy(path):
        with monkeypatch.context() as patch:
            patch.setattr(os, "unlink", defer_open_file)
            return direct_deploy(path)

    yield deploy
    for path in pending:
        try:
            original_unlink(path)
        except PermissionError:
            pass
