"""Read-only repository census. Run from the project root; never executes project code."""
from pathlib import Path
import json, os, re, subprocess, collections, concurrent.futures, argparse
from build_catalog import description
from text_output import configure_output, write_utf8_lf

ROOT = Path(__file__).resolve().parents[2]
CATEGORIES = 'ai-agents ai-agents-mem ai-agents-proxy ai-agents-sandbox ai-agents-skills ai-agents-swarm ai-agents-tokens ai-eval ai-gen ai-info ai-media ai-model-edit ai-model-run ai-operate ai-prompts ai-query ai-security ai-skills ai-spec'.split()
TOPICS = {
 'ai-agents':['agents','models','channels'], 'ai-agents-mem':['memory','evolution'],
 'ai-agents-proxy':['models','decisions'], 'ai-agents-sandbox':['agents','channels'],
 'ai-agents-skills':['skills','evolution'], 'ai-agents-swarm':['agents','decisions'],
 'ai-agents-tokens':['models','evolution'], 'ai-eval':['evolution','decisions'],
 'ai-gen':['import-generation','channels'], 'ai-info':['agents','evolution'],
 'ai-media':['import-generation'], 'ai-model-edit':['models','evolution'],
 'ai-model-run':['models'], 'ai-operate':['agents','channels'],
 'ai-prompts':['skills','evolution'], 'ai-query':['memory','import-generation','decisions'],
 'ai-security':['agents','skills','evolution'], 'ai-skills':['skills'], 'ai-spec':['skills','evolution']
}

def git(p,*args):
    r=subprocess.run(['git','-c','safe.directory='+p.as_posix(),'-C',str(p),*args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=30,
                     creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
    return r.stdout.strip() if r.returncode==0 else ''

def inspect(p):
    remote=git(p,'config','--get','remote.origin.url')
    remote=re.sub(r'^git@github.com:', 'https://github.com/',remote).removesuffix('.git').rstrip('/')
    remote=re.sub(r'^ssh://git@github.com/','https://github.com/',remote)
    # Do not persist credentials embedded in remotes.
    remote=re.sub(r'(https?://)[^/@]+@',r'\1',remote)
    revision=git(p,'rev-parse','HEAD')
    files=git(p,'ls-files').splitlines()
    names={x.lower():x for x in files if '/' not in x}
    readme=next((names[x] for x in ('readme.md','readme.rst','readme.txt','readme') if x in names),None)
    readme_text=(p/readme).read_text(encoding='utf-8',errors='replace')[:45000] if readme else ''
    manifests=[x for x in files if x.split('/')[-1] in ('package.json','pyproject.toml','Cargo.toml','go.mod','requirements.txt','pom.xml','build.gradle','pubspec.yaml')]
    license_files=[x for x in files if '/' not in x and x.lower().startswith(('license','copying'))]
    license_text=(p/license_files[0]).read_text(encoding='utf-8',errors='replace')[:2500] if license_files else ''
    license_hint=next((name for pattern,name in [(r'MIT License','MIT'),(r'Apache License','Apache-2.0'),(r'GNU AFFERO','AGPL; inspect version'),(r'GNU GENERAL','GPL; inspect version'),(r'BSD','BSD; inspect variant'),(r'Business Source','BSL; inspect parameters')] if re.search(pattern,license_text,re.I)),'not classified; inspect source')
    slug=p.parent.name+'--'+p.name
    return dict(id=slug,category=p.parent.name,name=p.name,github=remote,revision=revision,
       commit_date=git(p,'show','-s','--format=%cI','HEAD'),file_count=len(files),readme=readme,
       readme_text=readme_text,manifests=manifests[:60],license_files=license_files,license_hint=license_hint,
       topics=TOPICS[p.parent.name],report='projects/'+slug+'.md',files=files)

if __name__=='__main__':
    configure_output()
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--full',action='store_true',help='Include raw README text and full file lists for further investigation')
    args=parser.parse_args()
    paths=[p for c in CATEGORIES for p in sorted((ROOT.parent/c).iterdir()) if p.is_dir() and not p.name.startswith('.')]
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        projects=list(pool.map(inspect,paths))
    for p in projects:
        p['screening_excerpt']=description(p['readme_text'])
        if not args.full:
            del p['readme_text']
            del p['files']
    out=ROOT/'spec/data'
    out.mkdir(parents=True,exist_ok=True)
    write_utf8_lf(out/'inventory.json',json.dumps(projects,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'projects':len(projects),'categories':dict(collections.Counter(p['category'] for p in projects)), 'missing_remotes':[p['id'] for p in projects if not p['github']]}))
