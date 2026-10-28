"""Build screening reports and coverage indexes without overwriting authored analysis."""
from pathlib import Path
import json,re,collections
from urllib.parse import quote
from text_output import configure_output, write_utf8_lf

BASE=Path(__file__).resolve().parents[1]

def blob(p,file):
    if 'gist.github.com/' in p['github']:
        return p['github']+'/'+p['revision']+'#file-'+re.sub(r'[^a-z0-9-]','-',file.lower())
    if 'gitlab.com/' in p['github']:
        return p['github']+'/-/blob/'+p['revision']+'/'+quote(file,safe='/')
    return p['github']+'/blob/'+p['revision']+'/'+quote(file,safe='/')

def description(text):
    text=re.sub(r'```.*?```','',text,flags=re.S)
    text=re.sub(r'<[^>]*>',' ',text)
    text=re.sub(r'!\[[^\]]*\]\([^)]*\)','',text)
    text=re.sub(r'\[([^\]]+)\]\([^)]*\)',r'\1',text)
    lines=[]
    for line in text.splitlines():
        line=line.strip().strip('>*_ ')
        if 65<len(line)<1200 and not line.startswith(('#','|','http','[!','npm ','pip ','uv ','Copyright','Licensed','git clone')) and not re.search(r'(badge|shields.io|align=|stargazers)',line,re.I):
            lines.append(line)
        if len(lines)==2:break
    return ' '.join(lines)[:550].replace('[','').replace(']','') or 'No concise purpose statement extracted; inspect the upstream README.'

def main():
    configure_output()
    projects=json.loads((BASE/'data/inventory.json').read_text(encoding='utf-8'))
    reviews={}
    for f in (BASE/'data').glob('*-review.json'):
        for r in json.loads(f.read_text(encoding='utf-8')): reviews[r['id']]=r
    for p in projects:
        path=BASE/p['report']
        if path.exists():continue
        desc=p.get('screening_excerpt') or description(p.get('readme_text',''))
        readme_link=f"[README]({blob(p,p['readme'])})" if p.get('readme') else 'README not identified at repository root'
        manifests='; '.join(f"[{f}]({blob(p,f)})" for f in p['manifests'][:5]) or 'No common build manifest identified.'
        license_links='; '.join(f"[{f}]({blob(p,f)})" for f in p['license_files']) or 'No root license file identified; reuse rights unverified.'
        topics=' · '.join(f'[{t}](../{t}.md)' for t in p['topics'])
        text=f'''# {p['name']}

Source: [{p['name']}]({p['github']}) · Category: [{p['category']}](../categories/{p['category']}.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `{p['revision']}`; commit timestamp `{p['commit_date']}`; {p['file_count']:,} tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from {readme_link}):

> {desc.replace(chr(10),' ')}

Build/package evidence: {manifests}

License evidence: {license_links} Classification hint: {p['license_hint']}. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **{p['category']}**. Its category places it in the candidate set for {', '.join(p['topics'])}; those associations are navigational and have not been individually validated as implemented capabilities. See {topics} for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
'''
        write_utf8_lf(path,text)
    catalog=[]
    for p in projects:
        review=reviews.get(p['id'])
        depth=('design-reviewed' if review.get('evidence_kind')=='design-source' else review.get('depth','source-reviewed')) if review else 'screened'
        catalog.append({k:p[k] for k in ('id','category','name','github','revision','commit_date','report')} | {'depth':depth,'topics':review['topics'] if review else p['topics'],'summary':review['summary'] if review else 'Inventory / README only; implementation not independently established.'})
    write_utf8_lf(BASE/'data/coverage.json',json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    notes_path=BASE/'data/category-notes.json'
    category_notes=json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
    for category in dict.fromkeys(p['category'] for p in projects):
        rows=[p for p in catalog if p['category']==category]
        deep=sum(p['depth']!='screened' for p in rows)
        text=f'# {category}\n\n[Analysis home](../README.md) · {len(rows)} projects catalogued; {deep} focused source/content reviews.\n\nScreening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).\n'
        if category in category_notes:
            n=category_notes[category]
            text+=f"\n## Category assessment\n\n{n['role']}\n\n{n['conclusion']}\n\n{n['boundary']}\n\nStart with:\n\n"
            for id in n['first_reports']:
                p=next(x for x in catalog if x['id']==id)
                text+=f"- [{p['name']}]({p['github']}) — [individual report](../{p['report']}).\n"
        text+='\n## Project catalogue\n\n| Project source | Individual report | Depth | Harness relevance / finding |\n|---|---|---|---|\n'
        for p in rows:
            text+=f"| [{p['name']}]({p['github']}) | [Report](../{p['report']}) | {p['depth']} | {p['summary'].replace('|','/')} |\n"
        write_utf8_lf(BASE/'categories'/f'{category}.md',text)
    readme=BASE/'README.md'
    if readme.exists():
        content=readme.read_text(encoding='utf-8')
        table='<!-- categories:start -->\n| Category | Projects | Focused reviews |\n|---|---:|---:|\n'
        for category in dict.fromkeys(p['category'] for p in projects):
            rows=[p for p in catalog if p['category']==category]
            table+=f"| [{category}](categories/{category}.md) | {len(rows)} | {sum(p['depth']!='screened' for p in rows)} |\n"
        table+='<!-- categories:end -->'
        content=re.sub(r'<!-- categories:start -->.*?<!-- categories:end -->',lambda _:table,content,flags=re.S)
        write_utf8_lf(readme,content)
    # Rebuild these bounded generated sections as authored topics become available.
    for topic in sorted({t for p in catalog for t in p['topics']}):
        path=BASE/f'{topic}.md'
        if not path.exists():continue
        content=path.read_text(encoding='utf-8').split('<!-- coverage:start -->')[0].rstrip()
        rows=[p for p in catalog if topic in p['topics']]
        content+='\n\n<!-- coverage:start -->\n## Project coverage\n\nEvery associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.\n\n| Source | Report | Depth |\n|---|---|---|\n'
        for p in rows:content+=f"| [{p['name']}]({p['github']}) | [Report]({p['report']}) | {p['depth']} |\n"
        content+='<!-- coverage:end -->\n'
        write_utf8_lf(path,content)
    print(json.dumps({'catalogued':len(projects),'source_reviewed':len(reviews),'screened':len(projects)-len(reviews)}))

if __name__=='__main__':main()
