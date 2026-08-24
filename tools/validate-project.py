from __future__ import annotations

import hashlib
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRS = {'.git', '.gradle', 'build', 'app/build', 'third_party/llama.cpp'}
SOURCE_SUFFIXES = {'.html', '.js', '.css', '.json'}


def ignored(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return any(rel == item or rel.startswith(item + '/') for item in IGNORED_DIRS)


def files() -> list[Path]:
    return [p for p in ROOT.rglob('*') if p.is_file() and not ignored(p)]


def resolve_local(source: Path, reference: str) -> Path | None:
    if not reference or reference.startswith(('#', 'http://', 'https://', '//', 'data:', 'mailto:', 'javascript:')):
        return None
    clean = reference.split('#', 1)[0].split('?', 1)[0]
    if not clean or clean.startswith(('blob:', 'tel:')):
        return None
    target = (source.parent / clean).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return target


def main() -> int:
    all_files = files()
    known = set(all_files)
    missing: list[tuple[Path, str, Path]] = []

    html_pattern = re.compile(r'''(?:src|href)\s*=\s*["']([^"']+)["']''', re.I)
    css_pattern = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''', re.I)
    js_pattern = re.compile(r'''(?:from\s*|import\s*\(\s*)["']([^"']+)["']''', re.I)

    for source in all_files:
        if source.suffix not in {'.html', '.js', '.css'}:
            continue
        try:
            text = source.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue

        patterns = []
        if source.suffix == '.html':
            patterns.append(html_pattern)
        elif source.suffix == '.css':
            patterns.append(css_pattern)
        else:
            patterns.append(js_pattern)

        for pattern in patterns:
            for match in pattern.finditer(text):
                ref = match.group(1)
                target = resolve_local(source, ref)
                if target is not None and target not in known:
                    missing.append((source, ref, target))

    if missing:
        print('Missing local references:')
        for source, ref, target in missing:
            print(f'  {source.relative_to(ROOT)} -> {ref} (expected {target.relative_to(ROOT)})')
        return 1

    hashes: dict[str, list[Path]] = defaultdict(list)
    for path in all_files:
        if path.suffix not in SOURCE_SUFFIXES or path.stat().st_size == 0:
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes[digest].append(path)

    duplicate_groups = [group for group in hashes.values() if len(group) > 1]
    if duplicate_groups:
        print('Exact duplicate source files detected (review before deleting; some may be intentional):')
        for group in duplicate_groups:
            print('  ' + ' | '.join(str(p.relative_to(ROOT)) for p in group))
    else:
        print('No exact duplicate source files detected.')

    basenames: dict[str, list[Path]] = defaultdict(list)
    for path in all_files:
        if path.suffix in SOURCE_SUFFIXES:
            basenames[path.name].append(path)
    repeated_names = [group for group in basenames.values() if len(group) > 1]
    if repeated_names:
        print('Repeated source filenames in different folders (not automatically an error):')
        for group in repeated_names:
            print('  ' + ' | '.join(str(p.relative_to(ROOT)) for p in group))

    print(f'Project validation passed: {len(all_files)} files checked.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
