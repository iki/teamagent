"""Check delivered links, census coverage and pinned local source anchors."""
from pathlib import Path
from urllib.parse import unquote,urlparse
import json,re,subprocess,collections,concurrent.futures

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'spec'
P=json.loads((BASE/'data/inventory.json').read_text(encoding='utf-8'))
by_id={p['id']:p for p in P}
by_repo_rev={(urlparse(p['github']).path.strip('/').lower(),p['revision']):p for p in P}
issues=[]; sources=collections.defaultdict(set); checked_links=0; checked_anchors=0; unknown_sources=set()
for md in BASE.rglob('*.md'):
    text=md.read_text(encoding='utf-8')
    if re.search(r'(?:(?<![A-Za-z])[A-Za-z]:[\\/](?!/)|file://)',text):issues.append(f'{md.relative_to(ROOT)}: absolute local path')
    targets=re.findall(r'\]\(([^)]+)\)',text)+re.findall(r'^\[[^\]]+\]:\s*(\S+)',text,re.M)
    for target in targets:
        target=target.strip('<>')
        if target.startswith(('mailto:','#')):continue
        if target.startswith(('https://','http://')):
            m=re.match(r'https://github.com/([^/]+/[^/]+)/blob/([0-9a-f]{40})/([^#]+)(?:#L(\d+)(?:-L(\d+))?)?$',target,re.I)
            if not m:
                m=re.match(r'https://gitlab.com/([^/]+/[^/]+)/-/blob/([0-9a-f]{40})/([^#]+)(?:#L(\d+)(?:-L(\d+))?)?$',target,re.I)
            gist=False
            if not m:
                m=re.match(r'https://gist.github.com/([^/]+/[^/]+)/([0-9a-f]{40})#file-(.*?)(?:-L(\d+)(?:-L(\d+))?)?$',target,re.I)
                gist=bool(m)
            if not m:continue
            repo,rev,file,start,end=m.groups(); file=unquote(file)
            p=by_repo_rev.get((repo.lower(),rev))
            if not p:unknown_sources.add(target);continue
            if gist:
                root=ROOT.parent/p['category']/p['name']
                candidate=next((f for f in root.iterdir() if f.is_file() and re.sub(r'[^a-z0-9-]','-',f.name.lower())==file),None)
                if candidate:file=candidate.name
                else:issues.append(f'{md.relative_to(ROOT)}: unresolved gist file anchor {target}');continue
            local=ROOT.parent/p['category']/p['name']/file
            if not local.is_file():issues.append(f'{md.relative_to(ROOT)}: missing source file {p["id"]}/{file}')
            else:
                sources[p['id']].add(file)
                if start:
                    count=len(local.read_bytes().splitlines())
                    if not(1<=int(start)<=int(end or start)<=count):issues.append(f'{md.relative_to(ROOT)}: invalid lines {target} (file {count} lines)')
                checked_anchors+=1
            continue
        path=(md.parent/unquote(target.split('#')[0])).resolve()
        if not path.exists():issues.append(f'{md.relative_to(ROOT)}: broken link {target}')
        checked_links+=1

for p in P:
    if not (BASE/p['report']).is_file():issues.append('missing report '+p['id'])
cats=set(p['category'] for p in P)
for c in cats:
    if not (BASE/'categories'/f'{c}.md').is_file():issues.append('missing category '+c)

def check_git(item):
    id,files=item;p=by_id[id];local=ROOT.parent/p['category']/p['name']
    cmd=['git','-c','safe.directory='+local.as_posix(),'-C',str(local),'diff','--no-ext-diff','--name-only',p['revision'],'--',*sorted(files)]
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=90)
    if r.returncode:return id+': git verification failed '+r.stderr.strip()
    if r.stdout.strip():return id+': cited source differs from pinned commit: '+r.stdout.strip().replace('\n',', ')
    return None
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    issues += [x for x in pool.map(check_git,sources.items()) if x]

coverage=json.loads((BASE/'data/coverage.json').read_text(encoding='utf-8'))
for p in coverage:
    for topic in p['topics']:
        path=BASE/f'{topic}.md'
        if not path.exists():issues.append(f'{p["id"]}: missing topic {topic}')
        elif p['report'] not in path.read_text(encoding='utf-8'):issues.append(f'{p["id"]}: not linked from {topic}')

result={'review_date':'2026-10-04','projects':len(P),'categories':len(cats),'markdown_documents':len(list(BASE.rglob('*.md'))),'relative_links_checked':checked_links,'pinned_source_links_checked':checked_anchors,'repositories_with_cited_files_checked':len(sources),'unique_cited_files':sum(map(len,sources.values())),'unmapped_external_source_links':sorted(unknown_sources),'issues':issues,'limits':['No runtime/model benchmarks or repository tests executed.','GitHub reachability and public availability of every pinned commit were not checked.','Link/source consistency checks do not validate semantic correctness of every conclusion.']}
(BASE/'data/validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(bool(issues))
