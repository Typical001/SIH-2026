"""Download primary-source research inputs without importing the application."""
import concurrent.futures, datetime, hashlib, json, pathlib, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parent
SOURCES = {
    'byu_current.html': 'https://www.scp.byu.edu/current_icebergs.html',
    'byu_database.html': 'https://www.scp.byu.edu/iceberg/default.html',
    'byu_history_v8.zip': 'https://www.scp.byu.edu/iceberg/consolidated_database_v8.0.zip',
    'usnic_current.csv': 'https://usicecenter.gov/File/DownloadCurrent?pId=134',
    'usnic_shelf_2022.zip': 'https://usicecenter.gov/File/Download?fname=USNIC_ANTARC_shelf_2022.zip',
}

def fetch(item):
    name, url = item
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            data = response.read()
            content_type = response.headers.get('Content-Type')
        (ROOT / name).write_bytes(data)
        return dict(file=name, url=url, retrieved_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), content_type=content_type)
    except Exception as exc:
        return dict(file=name, url=url, error=str(exc))

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        manifest = list(pool.map(fetch, SOURCES.items()))
    (ROOT / 'sources.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))
    for path in ROOT.glob('*.zip'):
        with zipfile.ZipFile(path) as archive:
            print(path.name, len(archive.namelist()), archive.namelist()[:8])
            for name in archive.namelist():
                if name.endswith('.csv'):
                    print(name, archive.read(name)[:700].decode(errors='replace'))
                    break
    print((ROOT / 'usnic_current.csv').read_text(errors='replace')[:2500])
