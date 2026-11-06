#!/usr/bin/env python3
"""Công cụ dữ liệu từ vựng.
  python3 tools/data_tool.py split   : (từ data.js đầy đủ HOẶC data.js + data-pro.js) -> viết lại data.js (miễn phí) + data-pro.js (Pro)
  python3 tools/data_tool.py merge out.json : gộp data.js + data-pro.js thành 1 file JSON đầy đủ để chỉnh sửa
Quy tắc Pro (phải khớp gate.js): Level 1-5 (L1..L5), TOCFL Band A (BA) và Đương Đại 1/2/3 (A1,A2,B1) từ bài 6 trở đi."""
import json, re, sys, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def read(path):
    p = os.path.join(ROOT, path)
    if not os.path.exists(p): return []
    s = open(p, encoding='utf-8').read()
    return json.loads(s[s.index('[{'):s.rindex(']') + 1])
def locked(l):
    m = re.match(r'\[([^\]]+)\]', l or ''); b = m.group(1) if m else ''
    if re.match(r'(L[1-5]|BA)$', b): return True
    if b in ('A1', 'A2', 'B1'):
        n = re.search(r'BÀI\s*(\d+)', l); return bool(n) and int(n.group(1)) > 5
    return False
def dump(a): return json.dumps(a, ensure_ascii=False, separators=(',', ':'))
def full():
    return read('data.js') + read('data-pro.js')   # data-pro chỉ chứa từ, nối vào cuối
def split():
    d = full()
    core = [x for x in d if not (x['type'] == 'word' and locked(x['lesson']))]
    pro = [x for x in d if x['type'] == 'word' and locked(x['lesson'])]
    open(os.path.join(ROOT, 'data.js'), 'w', encoding='utf-8').write('const DATA = ' + dump(core) + ';\n')
    open(os.path.join(ROOT, 'data-pro.js'), 'w', encoding='utf-8').write(
        '(function(a){for(var i=0;i<a.length;i++)DATA.push(a[i])})(' + dump(pro) + ');\n')
    print('core', len(core), 'pro', len(pro))
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'split': split()
    elif len(sys.argv) > 2 and sys.argv[1] == 'merge':
        open(sys.argv[2], 'w', encoding='utf-8').write(dump(full())); print('ok')
    else: print(__doc__)
