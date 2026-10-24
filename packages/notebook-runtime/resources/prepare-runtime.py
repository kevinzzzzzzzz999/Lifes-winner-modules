#!/usr/bin/env python3
"""Prepare an explicit external CPython/IPython runtime; never modify system Python."""
from pathlib import Path
import argparse
import importlib.metadata
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile

PACKAGE = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--destination', required=True, type=Path,
                    help='A new directory outside the extracted module package.')
args = parser.parse_args()
if sys.platform != 'darwin' or platform.machine() != 'arm64' or sys.version_info[:2] != (3, 14):
    raise SystemExit('This pinned runtime requires CPython 3.14 on an Apple Silicon Mac.')
destination = args.destination.expanduser().resolve()
if destination == PACKAGE or PACKAGE in destination.parents:
    raise SystemExit('Choose a runtime directory outside the module source package.')
if destination.exists():
    raise SystemExit('Destination already exists. Choose a new directory; nothing was replaced.')
destination.parent.mkdir(parents=True, exist_ok=True)
stage = Path(tempfile.mkdtemp(prefix='.inkspace-ipython-', dir=destination.parent))
try:
    packages = stage / 'packages'
    requirements = Path(__file__).with_name('requirements-darwin-arm64.lock')
    subprocess.run([sys.executable, '-I', '-m', 'pip', '--isolated', 'install',
                    '--disable-pip-version-check', '--no-input', '--index-url', 'https://pypi.org/simple',
                    '--cache-dir', str(stage / 'wheel-cache'),
                    '--only-binary=:all:', '--require-hashes', '--target', str(packages),
                    '-r', str(requirements)], check=True)
    # Match the kernel's isolated import mode, without consulting user site packages.
    probe = 'import sys;sys.path.insert(0,sys.argv[1]);import IPython,numpy,pandas,matplotlib,matplotlib_inline,psutil,openpyxl,xlrd;print("Runtime imports passed")'
    probe_environment = os.environ.copy()
    probe_environment['MPLCONFIGDIR'] = str(stage / 'runtime-cache/matplotlib')
    probe_environment['XDG_CACHE_HOME'] = str(stage / 'runtime-cache')
    subprocess.run([sys.executable, '-I', '-S', '-c', probe, str(packages)],
                   check=True, env=probe_environment)
    distributions = sorted(({'name': d.metadata['Name'], 'version': d.version}
                            for d in importlib.metadata.distributions(path=[str(packages)])),
                           key=lambda item: item['name'].casefold())
    provenance = {'schemaVersion': 1, 'engine': 'IPython', 'pythonVersion': platform.python_version(),
                  'platform': 'darwin-arm64', 'packages': distributions,
                  'requirements': requirements.name, 'source': 'https://pypi.org/simple'}
    (stage / 'PROVENANCE.json').write_text(json.dumps(provenance, indent=2) + '\n')
    shutil.rmtree(stage / 'wheel-cache', ignore_errors=True)
    # No personal paths, account values or interpreter location enter provenance.
    stage.rename(destination)
    print(json.dumps({'prepared': True, 'pythonVersion': platform.python_version(),
                      'packages': len(distributions), 'provenanceContainsLocalPaths': False}))
finally:
    if stage.exists():
        shutil.rmtree(stage)
