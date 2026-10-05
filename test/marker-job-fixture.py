"""Credential/model-free process ownership fixture for the Marker launcher."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import time

spec = importlib.util.spec_from_file_location("marker_job", sys.argv[1])
if spec is None or spec.loader is None:
    raise RuntimeError("Missing launcher fixture module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
job = module.own_windows_job()
child = subprocess.Popen(
    [sys.executable, "-I", "-c", "import time; time.sleep(60)"],
    stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW,
)
Path(sys.argv[3]).write_text(str(child.pid), encoding="ascii")
if sys.argv[2] == "cancel":
    time.sleep(60)
else:
    module.finish(0 if sys.argv[2] == "success" else 7)
